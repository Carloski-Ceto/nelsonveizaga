"""
seeders/seed_consultas_demo.py
Genera datos demo de consultas medicas a partir de citas existentes.

Reglas:
- Idempotente: no duplica consulta por cita (OneToOne).
- Solo usa citas con estado PROGRAMADA o CONFIRMADA.
- Al crear consulta, actualiza cita a ATENDIDA.
"""

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.GestionClinica.citas.models import Cita, EstadoCita
from apps.GestionClinica.consultas.models import ConsultaMedica
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.pacientes.models import Paciente
from apps.Usuarios.users.models import TipoUsuario, Usuario


CONSULTAS_OBJETIVO = 360
MIN_CONSULTAS_POR_ESPECIALISTA = 40


def _completar_citas_para_consultas(registrador, faltantes):
    pacientes = list(Paciente.objects.filter(activo=True).order_by('id_paciente')[:50])
    especialistas = list(Especialista.objects.filter(activo=True).order_by('id_especialista')[:6])
    if not pacientes or not especialistas:
        return 0, 0

    creados = 0
    existentes = 0
    base = timezone.localtime(timezone.now()).replace(hour=7, minute=30, second=0, microsecond=0)
    minute_pattern = [0, 10, 20, 30, 40, 50]
    hour_pattern = [7, 8, 9, 10, 11, 14, 15, 16, 17]

    for i in range(faltantes):
        paciente = pacientes[i % len(pacientes)]
        especialista = especialistas[i % len(especialistas)]
        day_offset = -((i * 5 + (i // 17)) % 180)
        hour = hour_pattern[(i + especialista.id_especialista) % len(hour_pattern)]
        minute = minute_pattern[(i + paciente.id_paciente) % len(minute_pattern)]
        start = (base + timedelta(days=day_offset)).replace(hour=hour, minute=minute)
        end = start + timedelta(minutes=30)

        cita, created = Cita.objects.get_or_create(
            id_paciente=paciente,
            id_especialista=especialista,
            fecha_hora_inicio=start,
            defaults={
                'fecha_hora_fin': end,
                'motivo': f'Control demo reportes #{i + 1}',
                'estado': EstadoCita.ATENDIDA,
                'registrado_por': registrador,
            },
        )
        if created:
            creados += 1
        else:
            existentes += 1
            if cita.estado not in [EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA]:
                cita.estado = EstadoCita.ATENDIDA
                cita.save(update_fields=['estado', 'fecha_actualizacion'])

    return creados, existentes


def _usuario_registrador():
    candidato = (
        Usuario.objects.filter(tipo_usuario__in=[TipoUsuario.MEDICO, TipoUsuario.ESPECIALISTA, TipoUsuario.ADMIN])
        .order_by('id')
        .first()
    )
    return candidato


def _asegurar_consultas_minimas_por_especialista(registrador):
    especialistas = list(Especialista.objects.filter(activo=True).order_by('id_especialista'))
    pacientes = list(Paciente.objects.filter(activo=True).order_by('id_paciente')[:60])
    if not especialistas or not pacientes:
        return 0, 0

    creados = 0
    existentes = 0
    ahora = timezone.localtime(timezone.now()).replace(hour=7, minute=30, second=0, microsecond=0)
    minute_pattern = [0, 10, 20, 30, 40, 50]
    hour_pattern = [7, 8, 9, 10, 11, 14, 15, 16, 17]

    for idx_especialista, especialista in enumerate(especialistas):
        actual = ConsultaMedica.objects.filter(id_especialista=especialista).count()
        faltantes = max(0, MIN_CONSULTAS_POR_ESPECIALISTA - actual)
        if faltantes == 0:
            continue

        for i in range(faltantes):
            paciente = pacientes[(idx_especialista + i) % len(pacientes)]
            serial = idx_especialista * MIN_CONSULTAS_POR_ESPECIALISTA + i
            day_offset = -((serial * 3 + idx_especialista) % 180)
            hour = hour_pattern[(serial + idx_especialista) % len(hour_pattern)]
            minute = minute_pattern[(serial + paciente.id_paciente) % len(minute_pattern)]
            start = (ahora + timedelta(days=day_offset)).replace(hour=hour, minute=minute)
            end = start + timedelta(minutes=30)

            cita, cita_created = Cita.objects.get_or_create(
                id_paciente=paciente,
                id_especialista=especialista,
                fecha_hora_inicio=start,
                defaults={
                    'fecha_hora_fin': end,
                    'motivo': f'Control demo especialista #{especialista.id_especialista}-{i + 1}',
                    'estado': EstadoCita.ATENDIDA,
                    'registrado_por': registrador,
                },
            )
            if not cita_created and cita.estado not in [EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA]:
                cita.estado = EstadoCita.ATENDIDA
                cita.save(update_fields=['estado', 'fecha_actualizacion'])

            consulta, consulta_created = ConsultaMedica.objects.get_or_create(
                id_cita=cita,
                defaults={
                    'id_paciente': paciente,
                    'id_especialista': especialista,
                    'motivo_consulta': f'Control por especialidad {especialista.especialidad} #{i + 1}',
                    'anamnesis': 'Seguimiento clínico demo para reportes.',
                    'hallazgos': 'Evolución estable sin signos de alarma.',
                    'diagnostico': 'Control oftalmológico de rutina.',
                    'plan_tratamiento': 'Continuar controles periódicos y tratamiento indicado.',
                    'registrado_por': registrador,
                },
            )

            if consulta_created:
                offset_min = (paciente.id_paciente * 3 + especialista.id_especialista) % 17
                consulta_ts = cita.fecha_hora_inicio + timedelta(minutes=12 + offset_min)
                ConsultaMedica.objects.filter(pk=consulta.pk).update(
                    fecha_creacion=consulta_ts,
                    fecha_actualizacion=consulta_ts,
                )
                creados += 1
            else:
                existentes += 1

    return creados, existentes


@transaction.atomic
def run():
    creados = 0
    existentes = 0

    registrador = _usuario_registrador()
    if not registrador:
        raise ValueError('No existe usuario registrador (MEDICO/ESPECIALISTA/ADMIN). Ejecuta seed_clinica primero.')

    citas_disponibles = (
        Cita.objects.select_related('id_paciente', 'id_especialista')
        .filter(estado__in=[EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA])
        .order_by('-fecha_hora_inicio')
    )

    if not citas_disponibles.exists():
        paciente = Paciente.objects.order_by('id_paciente').first()
        especialista = Especialista.objects.order_by('id_especialista').first()
        if not paciente or not especialista:
            raise ValueError(
                'No hay datos clínicos base para generar consultas demo. Ejecuta seed --only clinica primero.'
            )

        inicio = timezone.now() + timedelta(days=1)
        inicio = inicio.replace(hour=10, minute=0, second=0, microsecond=0)
        fin = inicio + timedelta(minutes=30)

        nueva_cita, created = Cita.objects.get_or_create(
            id_paciente=paciente,
            id_especialista=especialista,
            fecha_hora_inicio=inicio,
            defaults={
                'fecha_hora_fin': fin,
                'motivo': 'Cita generada por seeder consultas-demo',
                'estado': EstadoCita.PROGRAMADA,
                'registrado_por': registrador,
            },
        )
        if created:
            creados += 1
        else:
            existentes += 1

        citas_disponibles = Cita.objects.filter(id_cita=nueva_cita.id_cita)

    total_citas_disponibles = citas_disponibles.count()
    if total_citas_disponibles < CONSULTAS_OBJETIVO:
        c2, e2 = _completar_citas_para_consultas(registrador, CONSULTAS_OBJETIVO - total_citas_disponibles)
        creados += c2
        existentes += e2
        citas_disponibles = (
            Cita.objects.select_related('id_paciente', 'id_especialista')
            .filter(estado__in=[EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA])
            .order_by('-fecha_hora_inicio')
        )

    c3, e3 = _asegurar_consultas_minimas_por_especialista(registrador)
    creados += c3
    existentes += e3

    citas_disponibles = (
        Cita.objects.select_related('id_paciente', 'id_especialista')
        .filter(estado__in=[EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA])
        .order_by('-fecha_hora_inicio')
    )

    for idx, cita in enumerate(citas_disponibles[:CONSULTAS_OBJETIVO], start=1):
        consulta, created = ConsultaMedica.objects.get_or_create(
            id_cita=cita,
            defaults={
                'id_paciente': cita.id_paciente,
                'id_especialista': cita.id_especialista,
                'motivo_consulta': f'Control oftalmologico de seguimiento #{idx}',
                'anamnesis': 'Paciente refiere vision borrosa intermitente y fatiga visual.',
                'hallazgos': 'Agudeza visual corregida estable; sin signos de alarma en biomicroscopia.',
                'diagnostico': 'Astenopia asociada a esfuerzo visual prolongado.',
                'plan_tratamiento': 'Higiene visual, lubricante ocular y control en 30 dias.',
                'registrado_por': registrador,
            },
        )

        if created:
            creados += 1
            cita.estado = EstadoCita.ATENDIDA
            if not cita.fecha_hora_fin:
                cita.fecha_hora_fin = cita.fecha_hora_inicio + timedelta(minutes=30)
            cita.fecha_actualizacion = timezone.now()
            cita.save(update_fields=['estado', 'fecha_hora_fin', 'fecha_actualizacion'])
        else:
            existentes += 1

        offset_min = (cita.id_paciente.id_paciente * 3 + cita.id_especialista.id_especialista) % 17
        consulta_ts = cita.fecha_hora_inicio + timedelta(minutes=12 + offset_min)
        ConsultaMedica.objects.filter(pk=consulta.pk).update(
            fecha_creacion=consulta_ts,
            fecha_actualizacion=consulta_ts,
        )

    return creados, existentes
