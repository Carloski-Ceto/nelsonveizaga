"""
seeders/seed_dashboard_demo.py
Genera volumen de citas históricas y futuras para poblar métricas y reportes.

Requisitos:
- Deben existir al menos 1 paciente, 1 especialista y 1 usuario activo.

Características:
- Idempotente por combinación (especialista, fecha_hora_inicio) usando get_or_create.
- Genera estados variados: PROGRAMADA, CONFIRMADA, ATENDIDA, CANCELADA, REPROGRAMADA.
- Cubre ~6 meses de historial (semanal) + ventana corta futura.
"""

from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.GestionClinica.citas.models import Cita, EstadoCita
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.pacientes.models import Paciente
from apps.Usuarios.users.models import Usuario


ACTIVE_SLOT_STATES = (EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA)
MOTIVOS_REALISTAS = [
    'Control de presión intraocular',
    'Disminución de agudeza visual',
    'Seguimiento postoperatorio de catarata',
    'Evaluación de fondo de ojo en paciente diabético',
    'Irritación ocular persistente',
    'Cambio de graduación de lentes',
    'Seguimiento de glaucoma crónico',
    'Valoración de ojo seco',
    'Fotopsias y moscas volantes',
    'Revisión oftalmológica anual',
]


@transaction.atomic
def run():
    pacientes = list(Paciente.objects.filter(activo=True).order_by('id_paciente')[:40])
    especialistas = list(Especialista.objects.filter(activo=True).order_by('id_especialista')[:4])
    registrado_por = Usuario.objects.filter(estado='ACTIVO').order_by('id').first()

    if not pacientes or not especialistas or not registrado_por:
        return 0, 0

    creados = 0
    existentes = 0

    now = timezone.localtime(timezone.now())
    base = now.replace(hour=8, minute=0, second=0, microsecond=0)
    hour_pattern = [8, 9, 10, 11, 14, 15, 16, 17]
    minute_pattern = [0, 15, 30, 45]

    # Distribucion intencional para generar señal en dashboard y reportes.
    # 6 meses hacia atrás con granularidad semi-semanal, + ventana futura.
    weekly_pattern = [
        EstadoCita.ATENDIDA,
        EstadoCita.CANCELADA,
        EstadoCita.ATENDIDA,
        EstadoCita.REPROGRAMADA,
        EstadoCita.ATENDIDA,
        EstadoCita.CONFIRMADA,
        EstadoCita.PROGRAMADA,
        EstadoCita.ATENDIDA,
    ]

    windows = []
    for week_idx, day_offset in enumerate(range(-180, 1, 3)):
        windows.append((day_offset, weekly_pattern[week_idx % len(weekly_pattern)]))

    windows.extend(
        [
            (1, EstadoCita.CONFIRMADA),
            (3, EstadoCita.PROGRAMADA),
            (7, EstadoCita.PROGRAMADA),
            (14, EstadoCita.CONFIRMADA),
            (21, EstadoCita.PROGRAMADA),
            (28, EstadoCita.CONFIRMADA),
        ]
    )

    last_patient_id = None
    for i, (day_offset, estado) in enumerate(windows):
        for j, especialista in enumerate(especialistas):
            patient_idx = ((i * 17) + (j * 7) + abs(day_offset)) % len(pacientes)
            paciente = pacientes[patient_idx]
            if last_patient_id == paciente.id_paciente:
                paciente = pacientes[(patient_idx + 3) % len(pacientes)]
            last_patient_id = paciente.id_paciente
            hour = hour_pattern[(i + j) % len(hour_pattern)]
            minute = minute_pattern[(i * 2 + j) % len(minute_pattern)]
            start = (base + timedelta(days=day_offset)).replace(hour=hour, minute=minute)
            end = start + timedelta(minutes=30)
            motivo_realista = MOTIVOS_REALISTAS[(i + j) % len(MOTIVOS_REALISTAS)]

            # Evita violar la restriccion unica de slots activos por especialista+inicio.
            if estado in ACTIVE_SLOT_STATES and Cita.objects.filter(
                id_especialista=especialista,
                fecha_hora_inicio=start,
                estado__in=ACTIVE_SLOT_STATES,
            ).exists():
                existentes += 1
                continue

            defaults = {
                'fecha_hora_fin': end,
                'motivo': f'{motivo_realista} · control {start.strftime("%d/%m")}',
                'estado': estado,
                'registrado_por': registrado_por,
                'motivo_cancelacion': 'Conflicto de agenda' if estado == EstadoCita.CANCELADA else None,
                'motivo_reprogramacion': 'Ajuste de disponibilidad' if estado == EstadoCita.REPROGRAMADA else None,
                'observaciones': 'Dato de prueba para métricas de dashboard.',
            }

            cita = Cita.objects.filter(
                id_especialista=especialista,
                fecha_hora_inicio=start,
            ).order_by('id_cita').first()

            if cita:
                # Sincroniza pacientes/motivos demo para evitar dataset repetitivo.
                cita.id_paciente = paciente
                cita.fecha_hora_fin = end
                cita.motivo = defaults['motivo']
                cita.estado = defaults['estado']
                cita.registrado_por = registrado_por
                cita.motivo_cancelacion = defaults['motivo_cancelacion']
                cita.motivo_reprogramacion = defaults['motivo_reprogramacion']
                cita.observaciones = defaults['observaciones']
                cita.save(update_fields=[
                    'id_paciente', 'fecha_hora_fin', 'motivo', 'estado', 'registrado_por',
                    'motivo_cancelacion', 'motivo_reprogramacion', 'observaciones', 'fecha_actualizacion'
                ])
                existentes += 1
            else:
                Cita.objects.create(
                    id_paciente=paciente,
                    id_especialista=especialista,
                    fecha_hora_inicio=start,
                    **defaults,
                )
                creados += 1

    # Limpieza de motivos legacy y reasignación de paciente demo para evitar repeticiones
    legacy_qs = Cita.objects.filter(
        Q(motivo__startswith='Dashboard demo #') | Q(motivo__startswith='Dashboard demo ')
    ).select_related('id_especialista').order_by('-fecha_hora_inicio')
    for idx, cita in enumerate(legacy_qs):
        paciente = pacientes[(idx * 9 + cita.id_especialista_id * 5) % len(pacientes)]
        motivo_realista = MOTIVOS_REALISTAS[(idx + cita.id_especialista_id) % len(MOTIVOS_REALISTAS)]
        cita.id_paciente = paciente
        cita.motivo = f'{motivo_realista} · control {timezone.localtime(cita.fecha_hora_inicio).strftime("%d/%m")}'
        cita.save(update_fields=['id_paciente', 'motivo', 'fecha_actualizacion'])

    return creados, existentes
