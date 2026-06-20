"""
seeders/seed_clinica.py
Puebla datos base de dominio clínico para entorno dev:
- usuarios médicos/especialistas
- especialistas
- pacientes
- horarios de especialista
- cita de ejemplo futura

Idempotente por claves naturales (username, documento, registro, bloque horario).
"""

from datetime import datetime, time, timedelta

from django.db import transaction
from django.utils import timezone

from apps.GestionClinica.citas.models import Cita, EstadoCita, HorarioEspecialista
from apps.GestionClinica.especialistas.models import Especialista
from apps.GestionClinica.medicos.models import Medico
from apps.GestionClinica.pacientes.models import Paciente
from apps.Usuarios.users.models import EstadoUsuario, TipoUsuario, Usuario


USUARIOS_MEDICOS = [
    {
        'username': 'dr.carlos',
        'email': 'carlos.medico@oftalmologia.local',
        'nombres': 'Carlos',
        'apellidos': 'Mendoza',
        'tipo_usuario': TipoUsuario.MEDICO,
        'telefono': '70011111',
        'password': 'medico123',
    },
    {
        'username': 'dra.andrea',
        'email': 'andrea.especialista@oftalmologia.local',
        'nombres': 'Andrea',
        'apellidos': 'Suarez',
        'tipo_usuario': TipoUsuario.ESPECIALISTA,
        'telefono': '70022222',
        'password': 'especialista123',
    },
    {
        'username': 'dr.luis',
        'email': 'luis.medico@oftalmologia.local',
        'nombres': 'Luis',
        'apellidos': 'Alvarez',
        'tipo_usuario': TipoUsuario.MEDICO,
        'telefono': '70033333',
        'password': 'medico123',
    },
    {
        'username': 'dra.paola',
        'email': 'paola.especialista@oftalmologia.local',
        'nombres': 'Paola',
        'apellidos': 'Herrera',
        'tipo_usuario': TipoUsuario.ESPECIALISTA,
        'telefono': '70044444',
        'password': 'especialista123',
    },
    {
        'username': 'dr.renzo',
        'email': 'renzo.medico@oftalmologia.local',
        'nombres': 'Renzo',
        'apellidos': 'Ortiz',
        'tipo_usuario': TipoUsuario.MEDICO,
        'telefono': '70055555',
        'password': 'medico123',
    },
    {
        'username': 'dra.sofia',
        'email': 'sofia.especialista@oftalmologia.local',
        'nombres': 'Sofia',
        'apellidos': 'Ribera',
        'tipo_usuario': TipoUsuario.ESPECIALISTA,
        'telefono': '70066666',
        'password': 'especialista123',
    },
]

PACIENTES_BASE = [
    {
        'nombres': 'Lucia',
        'apellidos': 'Fernandez',
        'documento_identidad': 'CI-1001001',
        'fecha_nacimiento': datetime(1992, 6, 14).date(),
        'sexo': 'F',
        'telefono': '72100001',
        'email': 'lucia.fernandez@example.com',
        'direccion': 'Av. Banzer #1234',
        'activo': True,
    },
    {
        'nombres': 'Miguel',
        'apellidos': 'Rojas',
        'documento_identidad': 'CI-1001002',
        'fecha_nacimiento': datetime(1987, 11, 2).date(),
        'sexo': 'M',
        'telefono': '72100002',
        'email': 'miguel.rojas@example.com',
        'direccion': 'Calle Libertad #89',
        'activo': True,
    },
    {
        'nombres': 'Valeria',
        'apellidos': 'Torrez',
        'documento_identidad': 'CI-1001003',
        'fecha_nacimiento': datetime(1995, 3, 21).date(),
        'sexo': 'F',
        'telefono': '72100003',
        'email': 'valeria.torrez@example.com',
        'direccion': 'Barrio Norte #45',
        'activo': True,
    },
    {
        'nombres': 'Jose',
        'apellidos': 'Guzman',
        'documento_identidad': 'CI-1001004',
        'fecha_nacimiento': datetime(1979, 8, 9).date(),
        'sexo': 'M',
        'telefono': '72100004',
        'email': 'jose.guzman@example.com',
        'direccion': 'Av. Grigota #210',
        'activo': True,
    },
    {
        'nombres': 'Camila',
        'apellidos': 'Arias',
        'documento_identidad': 'CI-1001005',
        'fecha_nacimiento': datetime(2001, 1, 30).date(),
        'sexo': 'F',
        'telefono': '72100005',
        'email': 'camila.arias@example.com',
        'direccion': 'Zona Equipetrol #12',
        'activo': True,
    },
    {
        'nombres': 'Daniel',
        'apellidos': 'Lopez',
        'documento_identidad': 'CI-1001006',
        'fecha_nacimiento': datetime(1983, 12, 5).date(),
        'sexo': 'M',
        'telefono': '72100006',
        'email': 'daniel.lopez@example.com',
        'direccion': 'Calle Suarez Arana #77',
        'activo': True,
    },
    {
        'nombres': 'Natalia',
        'apellidos': 'Rivera',
        'documento_identidad': 'CI-1001007',
        'fecha_nacimiento': datetime(1990, 10, 12).date(),
        'sexo': 'F',
        'telefono': '72100007',
        'email': 'natalia.rivera@example.com',
        'direccion': 'Av. Busch #501',
        'activo': True,
    },
    {
        'nombres': 'Pablo',
        'apellidos': 'Vargas',
        'documento_identidad': 'CI-1001008',
        'fecha_nacimiento': datetime(1975, 4, 18).date(),
        'sexo': 'M',
        'telefono': '72100008',
        'email': 'pablo.vargas@example.com',
        'direccion': 'Plan 3000, mz 9',
        'activo': True,
    },
    {
        'nombres': 'Mariana',
        'apellidos': 'Salazar',
        'documento_identidad': 'CI-1001009',
        'fecha_nacimiento': datetime(1998, 7, 7).date(),
        'sexo': 'F',
        'telefono': '72100009',
        'email': 'mariana.salazar@example.com',
        'direccion': 'Av. Santos Dumont #811',
        'activo': True,
    },
    {
        'nombres': 'Ricardo',
        'apellidos': 'Mendez',
        'documento_identidad': 'CI-1001010',
        'fecha_nacimiento': datetime(1986, 9, 14).date(),
        'sexo': 'M',
        'telefono': '72100010',
        'email': 'ricardo.mendez@example.com',
        'direccion': 'Canal Isuto #320',
        'activo': True,
    },
    {
        'nombres': 'Gabriela',
        'apellidos': 'Pinto',
        'documento_identidad': 'CI-1001011',
        'fecha_nacimiento': datetime(1993, 2, 25).date(),
        'sexo': 'F',
        'telefono': '72100011',
        'email': 'gabriela.pinto@example.com',
        'direccion': 'Av. Beni #930',
        'activo': True,
    },
    {
        'nombres': 'Sergio',
        'apellidos': 'Quispe',
        'documento_identidad': 'CI-1001012',
        'fecha_nacimiento': datetime(1981, 5, 3).date(),
        'sexo': 'M',
        'telefono': '72100012',
        'email': 'sergio.quispe@example.com',
        'direccion': 'Barrio Hamacas #66',
        'activo': True,
    },
]

PACIENTES_GENERADOS_OBJETIVO = 60

DEPARTAMENTOS_DOC = ['SC', 'LP', 'CB', 'OR', 'PT', 'TJ', 'CH', 'BN', 'PD']


def _next_business_day_start(hour=10, minute=0):
    base = timezone.localtime(timezone.now())
    candidate = base + timedelta(days=1)
    while candidate.weekday() >= 5:  # 5=sabado, 6=domingo
        candidate += timedelta(days=1)
    return candidate.replace(hour=hour, minute=minute, second=0, microsecond=0)


@transaction.atomic
def run():
    creados = 0
    existentes = 0

    # 1) Usuarios clínicos base
    usuarios = {}
    for data in USUARIOS_MEDICOS:
        user, created = Usuario.objects.get_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'nombres': data['nombres'],
                'apellidos': data['apellidos'],
                'tipo_usuario': data['tipo_usuario'],
                'telefono': data['telefono'],
                'estado': EstadoUsuario.ACTIVO,
                'is_staff': False,
                'is_active': True,
            },
        )
        if created:
            user.set_password(data['password'])
            user.save(update_fields=['password'])
            creados += 1
        else:
            existentes += 1
        usuarios[data['username']] = user

    # 2) Médicos (usuario MEDICO -> perfil médico)
    medicos_seed = [
        {
            'username': 'dr.carlos',
            'matricula': 'MED-REG-0001',
            'anios_experiencia': 12,
        },
        {
            'username': 'dr.luis',
            'matricula': 'MED-REG-0002',
            'anios_experiencia': 9,
        },
        {
            'username': 'dr.renzo',
            'matricula': 'MED-REG-0003',
            'anios_experiencia': 8,
        },
    ]

    medicos_by_username = {}

    for data in medicos_seed:
        medico, created = Medico.objects.get_or_create(
            matricula=data['matricula'],
            defaults={
                'id_usuario': usuarios[data['username']],
                'anios_experiencia': data['anios_experiencia'],
                'activo': True,
            },
        )
        creados += int(created)
        existentes += int(not created)
        medicos_by_username[data['username']] = medico

    # 3) Especialistas (médico -> especialista)
    especialista_1, created = Especialista.objects.get_or_create(
        registro_profesional='REG-OFT-0001',
        defaults={
            'id_medico': medicos_by_username['dr.carlos'],
            'especialidad': 'Oftalmologia general',
            'activo': True,
        },
    )
    creados += int(created)
    existentes += int(not created)

    especialista_2, created = Especialista.objects.get_or_create(
        registro_profesional='REG-OFT-0002',
        defaults={
            'id_medico': medicos_by_username['dr.luis'],
            'especialidad': 'Glaucoma',
            'activo': True,
        },
    )
    creados += int(created)
    existentes += int(not created)

    especialista_3, created = Especialista.objects.get_or_create(
        registro_profesional='REG-OFT-0003',
        defaults={
            'id_medico': medicos_by_username['dr.renzo'],
            'especialidad': 'Oftalmologia pediátrica',
            'activo': True,
        },
    )
    creados += int(created)
    existentes += int(not created)

    # 3) Pacientes base
    pacientes = []
    for data in PACIENTES_BASE:
        paciente, created = Paciente.objects.get_or_create(
            documento_identidad=data['documento_identidad'],
            defaults=data,
        )
        creados += int(created)
        existentes += int(not created)
        pacientes.append(paciente)

    # 3b) Pacientes generados para volumen de reportes (idempotente y con identidad variada)
    nombres = [
        'Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Fabian', 'Gloria', 'Hugo', 'Ines', 'Javier',
        'Karla', 'Luis', 'Marta', 'Nicolas', 'Olga', 'Pablo', 'Rocio', 'Samuel', 'Tatiana', 'Ulises',
        'Valentina', 'William', 'Ximena', 'Yamil', 'Zoe', 'Adriana', 'Belen', 'Ciro', 'Danna', 'Elias',
        'Fiorella', 'Gerardo', 'Helena', 'Ismael', 'Jimena', 'Kevin', 'Lorena', 'Mateo', 'Nadia', 'Oscar',
        'Patricia', 'Raul', 'Silvana', 'Tobias', 'Uriel', 'Vanessa', 'Walter', 'Yasmin', 'Zulema', 'Noe',
    ]
    apellidos = [
        'Lozano', 'Mora', 'Paredes', 'Vargas', 'Quiroga', 'Soto', 'Roca', 'Molina', 'Paz', 'Gomez',
        'Arce', 'Cespedes', 'Delgado', 'Escobar', 'Flores', 'Garcia', 'Herbas', 'Iriarte', 'Justiniano',
        'Ledezma', 'Mamani', 'Navia', 'Orellana', 'Peralta', 'Quintanilla', 'Ribera', 'Saavedra',
        'Torrico', 'Ugarte', 'Valdez', 'Yujra', 'Zamora', 'Aponte', 'Borda', 'Calvimontes', 'Duran',
        'Echazu', 'Franco', 'Gandarillas', 'Hinojosa', 'Ibanez', 'Jaldin', 'Klaric', 'Lanza', 'Monasterio',
        'Nogales', 'Ocampo', 'Prado', 'Rivero', 'Suarez',
    ]
    sexo_cycle = ['F', 'M', 'O']

    base_docs = {p['documento_identidad'] for p in PACIENTES_BASE}
    # Tomar como "generados" todo paciente que no pertenece al bloque base clínico fijo.
    generated_qs = Paciente.objects.exclude(documento_identidad__in=base_docs).order_by('id_paciente')
    generated = list(generated_qs)

    # Si faltan registros demo, crearlos primero para luego normalizar todo el bloque.
    missing = max(0, PACIENTES_GENERADOS_OBJETIVO - len(generated))
    for _ in range(missing):
        p = Paciente.objects.create(
            nombres='Temporal',
            apellidos='Temporal Demo',
            documento_identidad=f'TMP-{timezone.now().timestamp()}',
            fecha_nacimiento=datetime(1990, 1, 1).date(),
            sexo='F',
            telefono='70000000',
            email='paciente.tmp@example.com',
            direccion='Temporal',
            activo=True,
        )
        generated.append(p)
        creados += 1

    # Si hay más de los esperados, mantener los más recientes para evitar expansión infinita legacy.
    if len(generated) > PACIENTES_GENERADOS_OBJETIVO:
        to_keep = generated[:PACIENTES_GENERADOS_OBJETIVO]
        to_delete = generated[PACIENTES_GENERADOS_OBJETIVO:]
        for p in to_delete:
            p.delete()
        existentes += len(to_keep)
        generated = to_keep

    # Precalcular pares ordenados únicos para evitar apellidos/nombres repetidos.
    apellido_pairs = [(a, b) for a in apellidos for b in apellidos if a != b]
    nombre_pairs = [(a, b) for a in nombres for b in nombres if a != b]

    # Normalizar TODOS los pacientes demo generados con combinaciones no repetidas.
    for idx, paciente in enumerate(generated, start=1):
        dep = DEPARTAMENTOS_DOC[(idx * 5 + 1) % len(DEPARTAMENTOS_DOC)]
        seq = 2_000_000 + (idx * 97)
        check = (idx * 9 + 3) % 10
        doc = f'CI-{dep}-{seq}{check}'

        birth_year = 1958 + ((idx * 7) % 45)
        birth_month = ((idx * 11) % 12) + 1
        birth_day = ((idx * 13) % 28) + 1

        # Forzar mayor diversidad visible: paterno rota casi sin repetición en primeras filas.
        n1, n2 = nombre_pairs[((idx - 1) * 53) % len(nombre_pairs)]
        a1 = apellidos[((idx - 1) * 7) % len(apellidos)]
        a2 = apellidos[((idx - 1) * 19 + 3) % len(apellidos)]
        if a1 == a2:
            a2 = apellidos[((idx - 1) * 19 + 4) % len(apellidos)]

        paciente.nombres = f"{n1} {n2}"
        paciente.apellidos = f"{a1} {a2}"
        paciente.documento_identidad = doc
        paciente.fecha_nacimiento = datetime(birth_year, birth_month, birth_day).date()
        paciente.sexo = sexo_cycle[idx % len(sexo_cycle)]
        paciente.telefono = f"7{(2300000 + idx * 173) % 10000000:07d}"
        paciente.email = f"paciente.{dep.lower()}.{idx:03d}@example.com"
        paciente.direccion = f"Zona clínica {dep} · manzano {(idx * 17) % 90 + 10}"
        paciente.activo = True
        paciente.save(
            update_fields=[
                'nombres',
                'apellidos',
                'documento_identidad',
                'fecha_nacimiento',
                'sexo',
                'telefono',
                'email',
                'direccion',
                'activo',
                'fecha_actualizacion',
            ]
        )
        existentes += 1
        pacientes.append(paciente)

    # 4) Horarios
    horarios_seed = [
        {'id_especialista': especialista_1, 'dia_semana': 0, 'hora_inicio': time(8, 0), 'hora_fin': time(12, 0), 'duracion_slot_min': 30},
        {'id_especialista': especialista_1, 'dia_semana': 2, 'hora_inicio': time(14, 0), 'hora_fin': time(18, 0), 'duracion_slot_min': 30},
        {'id_especialista': especialista_2, 'dia_semana': 1, 'hora_inicio': time(9, 0), 'hora_fin': time(13, 0), 'duracion_slot_min': 30},
        {'id_especialista': especialista_3, 'dia_semana': 3, 'hora_inicio': time(8, 30), 'hora_fin': time(12, 30), 'duracion_slot_min': 30},
        {'id_especialista': especialista_2, 'dia_semana': 4, 'hora_inicio': time(14, 0), 'hora_fin': time(18, 0), 'duracion_slot_min': 30},
        {'id_especialista': especialista_3, 'dia_semana': 0, 'hora_inicio': time(13, 0), 'hora_fin': time(17, 0), 'duracion_slot_min': 30},
        {'id_especialista': especialista_1, 'dia_semana': 2, 'hora_inicio': time(9, 0), 'hora_fin': time(13, 0), 'duracion_slot_min': 30},
    ]
    for item in horarios_seed:
        _, created = HorarioEspecialista.objects.get_or_create(
            id_especialista=item['id_especialista'],
            dia_semana=item['dia_semana'],
            hora_inicio=item['hora_inicio'],
            hora_fin=item['hora_fin'],
            defaults={'duracion_slot_min': item['duracion_slot_min'], 'activo': True},
        )
        creados += int(created)
        existentes += int(not created)

    # 5) Cita futura de ejemplo
    inicio_local = _next_business_day_start(hour=10, minute=0)
    inicio = timezone.make_aware(inicio_local.replace(tzinfo=None), timezone.get_current_timezone()) if timezone.is_naive(inicio_local) else inicio_local
    fin = inicio + timedelta(minutes=30)

    _, created = Cita.objects.get_or_create(
        id_paciente=pacientes[0],
        id_especialista=especialista_1,
        fecha_hora_inicio=inicio,
        defaults={
            'fecha_hora_fin': fin,
            'motivo': 'Control de agudeza visual (seed)',
            'estado': EstadoCita.PROGRAMADA,
            'registrado_por': usuarios['dr.carlos'],
        },
    )
    creados += int(created)
    existentes += int(not created)

    # 6) Historias Clínicas (HistorialClinico) para todos los pacientes
    from apps.HistorialClinico.historial.models import HistorialClinico, EstadoHistorial
    admin_user = Usuario.objects.filter(tipo_usuario='ADMIN').first()
    if admin_user:
        for p in pacientes:
            _, created = HistorialClinico.objects.get_or_create(
                id_paciente=p,
                defaults={
                    'estado': EstadoHistorial.ACTIVO,
                    'registrado_por': admin_user,
                }
            )
            creados += int(created)
            existentes += int(not created)

    return creados, existentes
