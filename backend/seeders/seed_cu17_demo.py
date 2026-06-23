"""
Escenario reproducible para probar CU17 (receta de anteojos/contacto).

Garantiza un paciente con historial activo y una consulta atendida que contiene
refraccion OD/OI, pero que todavia no tiene receta optica.

Comportamiento idempotente:
- si existe una consulta elegible sin receta, la reutiliza;
- si la consulta anterior ya fue consumida por CU17, crea una reconsulta nueva;
- nunca modifica ni elimina recetas historicas.
"""

from datetime import date, timedelta

from django.db import transaction
from django.utils import timezone

from apps.GestionClinica.citas.models import Cita, EstadoCita
from apps.GestionClinica.consultas.models import ConsultaMedica
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.pacientes.models import Paciente
from apps.HistorialClinico.historial.models import EstadoHistorial, HistorialClinico
from apps.Usuarios.users.models import EstadoUsuario, TipoUsuario, Usuario


DEMO_DOCUMENTO = 'CU17-DEMO-001'
DEMO_MOTIVO_PREFIX = 'Demo CU17 - examen de refraccion'


def _obtener_registrador():
    return (
        Usuario.objects.filter(
            tipo_usuario=TipoUsuario.ADMIN,
            estado=EstadoUsuario.ACTIVO,
            is_active=True,
        )
        .order_by('id')
        .first()
    )


def _obtener_especialista():
    especialistas = (
        Especialista.objects.filter(
            activo=True,
            id_medico__activo=True,
            id_medico__id_usuario__estado=EstadoUsuario.ACTIVO,
            id_medico__id_usuario__is_active=True,
        )
        .select_related('id_medico__id_usuario')
        .order_by('id_especialista')
    )
    return (
        especialistas.filter(
            id_medico__id_usuario__tipo_usuario=TipoUsuario.ESPECIALISTA
        ).first()
        or especialistas.first()
    )


@transaction.atomic
def run():
    creados = 0
    existentes = 0

    registrador = _obtener_registrador()
    if registrador is None:
        raise ValueError(
            'CU17 demo requiere un usuario ADMIN activo. '
            'Ejecuta primero: python manage.py seed --only admin'
        )

    especialista = _obtener_especialista()
    if especialista is None:
        raise ValueError(
            'CU17 demo requiere un especialista activo. '
            'Ejecuta primero: python manage.py seed --only clinica'
        )

    paciente, paciente_creado = Paciente.objects.get_or_create(
        documento_identidad=DEMO_DOCUMENTO,
        defaults={
            'nombres': 'Paciente',
            'apellidos': 'Demo CU17',
            'fecha_nacimiento': date(1991, 6, 17),
            'sexo': 'F',
            'telefono': '70017017',
            'email': 'paciente.cu17@example.com',
            'direccion': 'Datos exclusivos para pruebas CU17',
            'activo': True,
        },
    )
    creados += int(paciente_creado)
    existentes += int(not paciente_creado)

    if not paciente.activo:
        paciente.activo = True
        paciente.save(update_fields=['activo', 'fecha_actualizacion'])

    historial = HistorialClinico.objects.filter(
        id_paciente=paciente,
        estado=EstadoHistorial.ACTIVO,
    ).first()
    if historial is None:
        HistorialClinico.objects.create(
            id_paciente=paciente,
            estado=EstadoHistorial.ACTIVO,
            registrado_por=registrador,
        )
        creados += 1
    else:
        existentes += 1

    consulta_disponible = (
        ConsultaMedica.objects.filter(
            id_paciente=paciente,
            refraccion_od_esfera__isnull=False,
            refraccion_oi_esfera__isnull=False,
            receta_optica__isnull=True,
        )
        .select_related('id_cita')
        .order_by('-fecha_creacion')
        .first()
    )
    if consulta_disponible is not None:
        existentes += 2  # cita + consulta listas para CU17
        return creados, existentes

    numero_reconsulta = ConsultaMedica.objects.filter(id_paciente=paciente).count() + 1
    inicio = timezone.now() - timedelta(days=1) + timedelta(minutes=numero_reconsulta)
    fin = inicio + timedelta(minutes=30)

    cita = Cita.objects.create(
        id_paciente=paciente,
        id_especialista=especialista,
        fecha_hora_inicio=inicio,
        fecha_hora_fin=fin,
        motivo=f'{DEMO_MOTIVO_PREFIX} #{numero_reconsulta}',
        estado=EstadoCita.ATENDIDA,
        observaciones='Cita generada para validar CU17.',
        registrado_por=registrador,
    )
    creados += 1

    especialista_usuario = especialista.id_medico.id_usuario
    consulta_registrador = (
        especialista_usuario
        if especialista_usuario.tipo_usuario == TipoUsuario.ESPECIALISTA
        else registrador
    )

    ConsultaMedica.objects.create(
        id_cita=cita,
        id_paciente=paciente,
        id_especialista=especialista,
        motivo_consulta='Vision borrosa de lejos y fatiga visual.',
        anamnesis='Paciente refiere cambio progresivo de graduacion.',
        hallazgos='Refraccion compatible con miopia y astigmatismo leve.',
        presion_intraocular_od='15.0',
        presion_intraocular_oi='14.5',
        refraccion_od_esfera='-1.25',
        refraccion_od_cilindro='-0.50',
        refraccion_od_eje=90,
        refraccion_oi_esfera='-1.00',
        refraccion_oi_cilindro='-0.25',
        refraccion_oi_eje=80,
        agudeza_visual_sc='20/40',
        agudeza_visual_cc='20/20',
        diagnostico='Miopia con astigmatismo leve.',
        codigo_cie10='H52.1',
        plan_tratamiento='Correccion optica y control anual.',
        registrado_por=consulta_registrador,
    )
    creados += 1

    return creados, existentes
