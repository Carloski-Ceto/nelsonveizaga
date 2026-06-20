from datetime import datetime, time, timedelta
import csv

from django.core.cache import cache
from django.db.models import Count, F, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.GestionClinica.citas.models import Cita, EstadoCita
from apps.GestionClinica.pacientes.models import Paciente

DASHBOARD_CACHE_TTL_SECONDS = 300


def _pct(part: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((part * 100.0) / total, 2)


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


def _cache_key(prefix: str, start_dt, end_dt):
    return f'dashboard:{prefix}:{start_dt.isoformat()}:{end_dt.isoformat()}'


def _build_drilldown_queryset(request):
    start_dt, end_dt, _, error = _resolve_range(request, default_mode='monthly')
    if error:
        return None, None, error

    estado = request.query_params.get('estado')
    qs = Cita.objects.select_related('id_paciente', 'id_especialista__id_medico__id_usuario').filter(
        fecha_hora_inicio__gte=start_dt,
        fecha_hora_inicio__lt=end_dt,
    )
    if estado:
        qs = qs.filter(estado=estado)

    return qs, (start_dt, end_dt, estado), None


def _parse_positive_int(value: str, field_name: str):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None, f'Parámetro inválido: {field_name} debe ser un entero positivo.'
    if parsed < 1:
        return None, f'Parámetro inválido: {field_name} debe ser un entero positivo.'
    return parsed, None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    start_dt, end_dt, period_type, error = _resolve_range(request, default_mode='monthly')
    if error:
        return Response({'detail': error}, status=400)

    cached = cache.get(_cache_key('summary', start_dt, end_dt))
    if cached:
        return Response(cached)

    pacientes_activos = Paciente.objects.filter(activo=True).count()
    citas_mes = Cita.objects.filter(fecha_hora_inicio__gte=start_dt, fecha_hora_inicio__lt=end_dt)
    citas_mes_total = citas_mes.count()
    citas_atendidas = citas_mes.filter(estado=EstadoCita.ATENDIDA).count()
    citas_canceladas = citas_mes.filter(estado=EstadoCita.CANCELADA).count()
    citas_reprogramadas = citas_mes.filter(estado=EstadoCita.REPROGRAMADA).count()

    resumen_estados = (
        citas_mes.values('estado')
        .annotate(total=Count('id_cita'))
        .order_by('estado')
    )

    payload = {
        'periodo': {
            'tipo': period_type,
            'desde': start_dt.isoformat(),
            'hasta': end_dt.isoformat(),
        },
        'headline': {
            'pacientes_activos': pacientes_activos,
            'citas_mes_total': citas_mes_total,
            'citas_atendidas': citas_atendidas,
            'citas_canceladas': citas_canceladas,
            'cancelacion_pct': _pct(citas_canceladas, citas_mes_total),
            'atencion_pct': _pct(citas_atendidas, citas_mes_total),
        },
        'distribucion_estados': list(resumen_estados),
        'tactico': {
            'reprogramadas_mes': citas_reprogramadas,
            'canceladas_mes': citas_canceladas,
        },
    }
    cache.set(_cache_key('summary', start_dt, end_dt), payload, DASHBOARD_CACHE_TTL_SECONDS)
    return Response(payload)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_operativo(request):
    start_dt, end_dt, period_type, error = _resolve_range(request, default_mode='daily')
    if error:
        return Response({'detail': error}, status=400)

    cached = cache.get(_cache_key('operativo', start_dt, end_dt))
    if cached:
        return Response(cached)

    citas_hoy = Cita.objects.filter(fecha_hora_inicio__gte=start_dt, fecha_hora_inicio__lt=end_dt)

    total_hoy = citas_hoy.count()
    programadas_hoy = citas_hoy.filter(estado=EstadoCita.PROGRAMADA).count()
    atendidas_hoy = citas_hoy.filter(estado=EstadoCita.ATENDIDA).count()
    canceladas_hoy = citas_hoy.filter(estado=EstadoCita.CANCELADA).count()

    por_especialista = (
        citas_hoy.values('id_especialista')
        .annotate(
            id_especialista__id_usuario__nombres=F('id_especialista__id_medico__id_usuario__nombres'),
            id_especialista__id_usuario__apellidos=F('id_especialista__id_medico__id_usuario__apellidos'),
            total=Count('id_cita'),
            atendidas=Count('id_cita', filter=Q(estado=EstadoCita.ATENDIDA)),
            canceladas=Count('id_cita', filter=Q(estado=EstadoCita.CANCELADA)),
        )
        .order_by('-total', 'id_especialista')
    )

    alertas = []
    if total_hoy > 0 and _pct(canceladas_hoy, total_hoy) >= 20:
        alertas.append({'nivel': 'warning', 'mensaje': 'La cancelación diaria superó 20%.'})
    if total_hoy == 0:
        alertas.append({'nivel': 'info', 'mensaje': 'No hay citas programadas para hoy.'})

    payload = {
        'periodo': {
            'tipo': period_type,
            'desde': start_dt.isoformat(),
            'hasta': end_dt.isoformat(),
        },
        'operativo': {
            'citas_hoy_total': total_hoy,
            'programadas_hoy': programadas_hoy,
            'atendidas_hoy': atendidas_hoy,
            'canceladas_hoy': canceladas_hoy,
        },
        'por_especialista': list(por_especialista),
        'alertas': alertas,
    }
    cache.set(_cache_key('operativo', start_dt, end_dt), payload, DASHBOARD_CACHE_TTL_SECONDS)
    return Response(payload)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_citas_drilldown(request):
    qs, _, error = _build_drilldown_queryset(request)
    if error:
        return Response({'detail': error}, status=400)

    page, page_error = _parse_positive_int(request.query_params.get('page', '1') or '1', 'page')
    if page_error:
        return Response({'detail': page_error}, status=400)

    page_size, page_size_error = _parse_positive_int(request.query_params.get('page_size', '20') or '20', 'page_size')
    if page_size_error:
        return Response({'detail': page_size_error}, status=400)

    page_size = min(page_size, 100)

    total = qs.count()
    offset = (page - 1) * page_size
    items = qs.order_by('-fecha_hora_inicio')[offset: offset + page_size]

    results = [
        {
            'id_cita': c.id_cita,
            'fecha_hora_inicio': c.fecha_hora_inicio,
            'estado': c.estado,
            'motivo': c.motivo,
            'paciente': f'{c.id_paciente.apellidos}, {c.id_paciente.nombres}',
            'especialista': f'{c.id_especialista.id_medico.id_usuario.apellidos}, {c.id_especialista.id_medico.id_usuario.nombres}',
        }
        for c in items
    ]

    return Response(
        {
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': results,
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_citas_drilldown_export(request):
    qs, ctx, error = _build_drilldown_queryset(request)
    if error:
        return Response({'detail': error}, status=400)

    start_dt, end_dt, estado = ctx
    rows = qs.order_by('-fecha_hora_inicio')[:5000]

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    estado_slug = estado or 'todos'
    filename = f'dashboard-citas-{start_dt.date().isoformat()}-{end_dt.date().isoformat()}-{estado_slug}.csv'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(['id_cita', 'fecha_hora_inicio', 'estado', 'motivo', 'paciente', 'especialista'])
    for c in rows:
        writer.writerow(
            [
                c.id_cita,
                timezone.localtime(c.fecha_hora_inicio).isoformat(),
                c.estado,
                c.motivo,
                f'{c.id_paciente.apellidos}, {c.id_paciente.nombres}',
                f'{c.id_especialista.id_medico.id_usuario.apellidos}, {c.id_especialista.id_medico.id_usuario.nombres}',
            ]
        )

    return response

