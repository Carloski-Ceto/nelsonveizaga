import csv
from datetime import datetime, time, timedelta
from io import BytesIO

from django.db.models import Count, Max, Min
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.utils import timezone
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsAdministrativoOrAdmin
from apps.GestionClinica.citas.models import Cita
from apps.GestionClinica.consultas.models import ConsultaMedica


def _normalize_text(value):
    return '' if value is None else str(value).lower()


def _filter_items(items, query, keys):
    q = (query or '').strip().lower()
    if not q:
        return items
    return [item for item in items if any(q in _normalize_text(item.get(k)) for k in keys)]


def _sort_items(items, sort_by, sort_dir, allowed_fields):
    field = sort_by if sort_by in allowed_fields else allowed_fields[0]
    reverse = (sort_dir or 'asc').lower() == 'desc'

    def sort_key(it):
        value = it.get(field)
        if isinstance(value, (int, float)):
            return (0, value)
        return (1, _normalize_text(value))

    return sorted(items, key=sort_key, reverse=reverse)


def _parse_date(value: str):
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except Exception:
        return None


def _resolve_range(request, default_mode: str):
    now = timezone.localtime(timezone.now())
    raw_from = request.query_params.get('date_from')
    raw_to = request.query_params.get('date_to')

    if raw_from and raw_to:
        start_date = _parse_date(raw_from)
        end_date = _parse_date(raw_to)
        if not start_date or not end_date or end_date < start_date:
            return None, None, None, 'Rango inválido. Usa formato YYYY-MM-DD y date_to >= date_from.'
        start_dt = timezone.make_aware(datetime.combine(start_date, time.min), timezone.get_current_timezone())
        end_dt = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), time.min), timezone.get_current_timezone())
        return start_dt, end_dt, 'custom', None

    if default_mode == 'monthly':
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
        return start_dt, end_dt, 'monthly', None

    start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_dt = start_dt + timedelta(days=1)
    return start_dt, end_dt, 'daily', None


def _build_pacientes_atendidos(start_dt, end_dt, paciente_id=None, search=None, sort_by=None, sort_dir='asc'):
    consultas = ConsultaMedica.objects.select_related('id_paciente').filter(
        fecha_creacion__gte=start_dt,
        fecha_creacion__lt=end_dt,
    )
    if paciente_id:
        consultas = consultas.filter(id_paciente_id=paciente_id)

    grouped = (
        consultas.values(
            'id_paciente',
            'id_paciente__nombres',
            'id_paciente__apellidos',
            'id_paciente__documento_identidad',
        )
        .annotate(
            total_consultas=Count('id_consulta'),
            primera_atencion=Min('fecha_creacion'),
            ultima_atencion=Max('fecha_creacion'),
        )
        .order_by('-ultima_atencion', 'id_paciente')
    )

    items = []
    for row in grouped:
        primera = row.get('primera_atencion')
        ultima = row.get('ultima_atencion')
        items.append(
            {
                'id_paciente': row['id_paciente'],
                'paciente': f"{row['id_paciente__apellidos']}, {row['id_paciente__nombres']}",
                'documento_identidad': row['id_paciente__documento_identidad'],
                'total_consultas': row['total_consultas'],
                'primera_atencion': primera.isoformat() if primera else None,
                'ultima_atencion': ultima.isoformat() if ultima else None,
            }
        )

    items = _filter_items(items, search, ['id_paciente', 'paciente', 'documento_identidad', 'total_consultas', 'primera_atencion', 'ultima_atencion'])
    items = _sort_items(items, sort_by, sort_dir, ['paciente', 'documento_identidad', 'total_consultas', 'primera_atencion', 'ultima_atencion', 'id_paciente'])

    return {
        'summary': {
            'total_consultas': consultas.count(),
            'total_pacientes_atendidos': len(items),
        },
        'items': items,
    }


def _build_citas_por_periodo(start_dt, end_dt, estado=None, especialista_id=None, search=None, sort_by=None, sort_dir='asc'):
    citas = Cita.objects.filter(fecha_hora_inicio__gte=start_dt, fecha_hora_inicio__lt=end_dt)
    if estado:
        citas = citas.filter(estado=estado)
    if especialista_id:
        citas = citas.filter(id_especialista_id=especialista_id)

    agrupado = (
        citas.annotate(fecha=TruncDate('fecha_hora_inicio'))
        .values('fecha', 'estado')
        .annotate(total=Count('id_cita'))
        .order_by('fecha', 'estado')
    )
    items = [
        {
            'fecha': row['fecha'].isoformat() if row.get('fecha') else None,
            'estado': row['estado'],
            'total': row['total'],
        }
        for row in agrupado
    ]
    items = _filter_items(items, search, ['fecha', 'estado', 'total'])
    items = _sort_items(items, sort_by, sort_dir, ['fecha', 'estado', 'total'])

    return {
        'summary': {
            'total_citas': citas.count(),
        },
        'items': items,
    }


def _build_consultas_por_especialista(start_dt, end_dt, especialista_id=None, search=None, sort_by=None, sort_dir='asc'):
    consultas = ConsultaMedica.objects.select_related('id_especialista__id_medico__id_usuario').filter(
        fecha_creacion__gte=start_dt,
        fecha_creacion__lt=end_dt,
    )
    if especialista_id:
        consultas = consultas.filter(id_especialista_id=especialista_id)

    grouped = (
        consultas.values(
            'id_especialista',
            'id_especialista__id_medico__id_usuario__nombres',
            'id_especialista__id_medico__id_usuario__apellidos',
            'id_especialista__especialidad',
        )
        .annotate(total_consultas=Count('id_consulta'))
        .order_by('-total_consultas', 'id_especialista')
    )

    items = [
        {
            'id_especialista': row['id_especialista'],
            'especialista': f"{row['id_especialista__id_medico__id_usuario__apellidos']}, {row['id_especialista__id_medico__id_usuario__nombres']}",
            'especialidad': row['id_especialista__especialidad'],
            'total_consultas': row['total_consultas'],
        }
        for row in grouped
    ]
    items = _filter_items(items, search, ['id_especialista', 'especialista', 'especialidad', 'total_consultas'])
    items = _sort_items(items, sort_by, sort_dir, ['especialista', 'especialidad', 'total_consultas', 'id_especialista'])

    return {
        'summary': {
            'total_consultas': consultas.count(),
            'total_especialistas': len(items),
        },
        'items': items,
    }


def _payload(period_type, start_dt, end_dt, body):
    return {
        'periodo': {
            'tipo': period_type,
            'desde': start_dt.isoformat(),
            'hasta': end_dt.isoformat(),
        },
        'summary': body['summary'],
        'items': body['items'],
    }


def _export_csv(filename, columns, items):
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
    writer = csv.writer(response)
    writer.writerow([c[1] for c in columns])
    for item in items:
        writer.writerow([item.get(c[0], '') for c in columns])
    return response


def _export_xlsx(filename, sheet_name, columns, items):
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name
    ws.append([c[1] for c in columns])
    for item in items:
        ws.append([item.get(c[0], '') for c in columns])

    buff = BytesIO()
    wb.save(buff)
    buff.seek(0)
    response = HttpResponse(
        buff.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
    return response


def _export_pdf(filename, title, columns, items):
    buff = BytesIO()
    doc = SimpleDocTemplate(buff, pagesize=landscape(A4))
    styles = getSampleStyleSheet()

    data = [[c[1] for c in columns]]
    for item in items:
        data.append([str(item.get(c[0], '')) for c in columns])

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c1d95')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cbd5e1')),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ]
        )
    )

    story = [Paragraph(title, styles['Title']), Spacer(1, 10), table]
    doc.build(story)
    buff.seek(0)

    response = HttpResponse(buff.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
    return response


def _export_response(request, base_filename, title, columns, items):
    fmt = (request.query_params.get('file_format') or 'csv').lower()
    if fmt == 'csv':
        return _export_csv(base_filename, columns, items)
    if fmt == 'xlsx':
        return _export_xlsx(base_filename, title[:31], columns, items)
    if fmt == 'pdf':
        return _export_pdf(base_filename, title, columns, items)
    return Response({'detail': 'Formato no soportado. Usa file_format=csv|xlsx|pdf.'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrativoOrAdmin])
def reporte_pacientes_atendidos(request):
    start_dt, end_dt, period_type, error = _resolve_range(request, default_mode='monthly')
    if error:
        return Response({'detail': error}, status=400)
    body = _build_pacientes_atendidos(
        start_dt,
        end_dt,
        request.query_params.get('paciente_id'),
        request.query_params.get('q'),
        request.query_params.get('sort_by'),
        request.query_params.get('sort_dir', 'asc'),
    )
    return Response(_payload(period_type, start_dt, end_dt, body))


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrativoOrAdmin])
def reporte_citas_por_periodo(request):
    start_dt, end_dt, period_type, error = _resolve_range(request, default_mode='monthly')
    if error:
        return Response({'detail': error}, status=400)
    body = _build_citas_por_periodo(
        start_dt,
        end_dt,
        request.query_params.get('estado'),
        request.query_params.get('especialista_id'),
        request.query_params.get('q'),
        request.query_params.get('sort_by'),
        request.query_params.get('sort_dir', 'asc'),
    )
    return Response(_payload(period_type, start_dt, end_dt, body))


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrativoOrAdmin])
def reporte_consultas_por_especialista(request):
    start_dt, end_dt, period_type, error = _resolve_range(request, default_mode='monthly')
    if error:
        return Response({'detail': error}, status=400)
    body = _build_consultas_por_especialista(
        start_dt,
        end_dt,
        request.query_params.get('especialista_id'),
        request.query_params.get('q'),
        request.query_params.get('sort_by'),
        request.query_params.get('sort_dir', 'asc'),
    )
    return Response(_payload(period_type, start_dt, end_dt, body))


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrativoOrAdmin])
def reporte_pacientes_atendidos_export(request):
    start_dt, end_dt, _, error = _resolve_range(request, default_mode='monthly')
    if error:
        return Response({'detail': error}, status=400)
    body = _build_pacientes_atendidos(
        start_dt,
        end_dt,
        request.query_params.get('paciente_id'),
        request.query_params.get('q'),
        request.query_params.get('sort_by'),
        request.query_params.get('sort_dir', 'asc'),
    )
    columns = [
        ('id_paciente', 'ID'),
        ('paciente', 'Paciente'),
        ('documento_identidad', 'Documento'),
        ('total_consultas', 'Total consultas'),
        ('primera_atencion', 'Primera atencion'),
        ('ultima_atencion', 'Ultima atencion'),
    ]
    return _export_response(request, 'reporte-pacientes-atendidos', 'Pacientes atendidos', columns, body['items'])


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrativoOrAdmin])
def reporte_citas_por_periodo_export(request):
    start_dt, end_dt, _, error = _resolve_range(request, default_mode='monthly')
    if error:
        return Response({'detail': error}, status=400)
    body = _build_citas_por_periodo(
        start_dt,
        end_dt,
        request.query_params.get('estado'),
        request.query_params.get('especialista_id'),
        request.query_params.get('q'),
        request.query_params.get('sort_by'),
        request.query_params.get('sort_dir', 'asc'),
    )
    columns = [('fecha', 'Fecha'), ('estado', 'Estado'), ('total', 'Total')]
    return _export_response(request, 'reporte-citas-por-periodo', 'Citas por periodo', columns, body['items'])


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrativoOrAdmin])
def reporte_consultas_por_especialista_export(request):
    start_dt, end_dt, _, error = _resolve_range(request, default_mode='monthly')
    if error:
        return Response({'detail': error}, status=400)
    body = _build_consultas_por_especialista(
        start_dt,
        end_dt,
        request.query_params.get('especialista_id'),
        request.query_params.get('q'),
        request.query_params.get('sort_by'),
        request.query_params.get('sort_dir', 'asc'),
    )
    columns = [
        ('id_especialista', 'ID medico/especialista'),
        ('especialista', 'Medico'),
        ('especialidad', 'Especialidad'),
        ('total_consultas', 'Total consultas'),
    ]
    return _export_response(request, 'reporte-consultas-por-especialista', 'Consultas por especialista', columns, body['items'])


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdministrativoOrAdmin])
def analizar_reporte_por_voz(request):
    """
    Receives a voice transcript, queries all 3 report datasets,
    and uses Gemini to generate a natural-language analysis.
    """
    import json
    from google import genai as google_genai
    from django.conf import settings as django_settings

    transcript = (request.data.get('transcript') or '').strip()
    if not transcript:
        return Response({'error': 'El transcript no puede estar vacío.'}, status=400)

    # Build a fake GET request-like object so _resolve_range can read query_params.
    # We accept date_from/date_to from the POST body OR query string.
    date_from = request.data.get('date_from') or request.query_params.get('date_from')
    date_to   = request.data.get('date_to')   or request.query_params.get('date_to')

    # Patch query_params in-place so _resolve_range picks them up.
    qp = request.query_params.copy()
    if date_from:
        qp['date_from'] = date_from
    if date_to:
        qp['date_to'] = date_to
    # Temporarily override the request's query_params.
    original_qp = request._request.GET
    request._request.GET = qp

    start_dt, end_dt, period_type, error = _resolve_range(request, default_mode='monthly')

    # Restore original query_params.
    request._request.GET = original_qp

    if error:
        return Response({'error': error}, status=400)

    # Reuse existing builder functions — no duplicated ORM.
    pacientes_body    = _build_pacientes_atendidos(start_dt, end_dt)
    citas_body        = _build_citas_por_periodo(start_dt, end_dt)
    especialistas_body = _build_consultas_por_especialista(start_dt, end_dt)

    # Slim down items for the prompt (avoid sending hundreds of rows to Gemini).
    context_data = {
        'periodo': {
            'desde': start_dt.date().isoformat(),
            'hasta': end_dt.date().isoformat(),
            'tipo': period_type,
        },
        'pacientes_atendidos': {
            'summary': pacientes_body['summary'],
            'items': pacientes_body['items'][:20],
        },
        'citas_por_periodo': {
            'summary': citas_body['summary'],
            'items': citas_body['items'][:50],
        },
        'consultas_por_especialista': {
            'summary': especialistas_body['summary'],
            'items': especialistas_body['items'][:20],
        },
    }

    prompt = (
        f"Sos un analista de reportes médicos de una clínica oftalmológica llamada Clínica de Ojos Norte.\n"
        f"Tenés acceso a los siguientes datos del período "
        f"{context_data['periodo']['desde']} al {context_data['periodo']['hasta']}:\n\n"
        f"{json.dumps(context_data, ensure_ascii=False, indent=2)}\n\n"
        f"El usuario dice: \"{transcript}\"\n\n"
        f"Respondé en español con un análisis claro, conciso y útil basado SOLO en los datos proporcionados. "
        f"Si el usuario pide algo que no está en los datos, indicalo brevemente. "
        f"Usá bullet points cuando ayude a la claridad. Máximo 300 palabras."
    )

    api_key = django_settings.GEMINI_API_KEY
    if not api_key:
        return Response({'error': 'GEMINI_API_KEY no configurada en el servidor.'}, status=503)

    try:
        client = google_genai.Client(api_key=api_key)
        gemini_response = client.models.generate_content(
            model=django_settings.GEMINI_MODEL,
            contents=prompt,
        )
        analisis = gemini_response.text
    except Exception as exc:
        msg = str(exc)
        if '429' in msg or 'RESOURCE_EXHAUSTED' in msg or 'quota' in msg.lower():
            return Response(
                {'error': 'Límite de solicitudes de Gemini alcanzado. Esperá unos segundos e intentá de nuevo.'},
                status=429,
            )
        return Response({'error': f'Error al llamar a Gemini: {msg}'}, status=502)

    return Response({
        'analisis': analisis,
        'periodo': context_data['periodo'],
        'datos': context_data,
    })
