"""
seeders/seed_permisos.py
Pobla la tabla permisos con los permisos granulares del sistema (IAM).
Idempotente: usa get_or_create.

Convención: '<modulo>.<accion>'
Módulos vigentes: users, bitacora, roles, permisos, pacientes, especialistas, medicos, citas, consultas, agenda, dashboard
"""
from apps.Usuarios.permisos.models import Permiso


PERMISOS = [
    # Usuarios
    {'codigo': 'users.listar',    'nombre': 'Listar usuarios',       'modulo': 'users'},
    {'codigo': 'users.ver',       'nombre': 'Ver usuario',            'modulo': 'users'},
    {'codigo': 'users.crear',     'nombre': 'Crear usuario',          'modulo': 'users'},
    {'codigo': 'users.editar',    'nombre': 'Editar usuario',         'modulo': 'users'},
    {'codigo': 'users.eliminar',  'nombre': 'Eliminar usuario',       'modulo': 'users'},

    # Bitácora
    {'codigo': 'bitacora.ver', 'nombre': 'Ver bitácora de auditoría', 'modulo': 'bitacora'},

    # Roles y permisos
    {'codigo': 'roles.listar',    'nombre': 'Listar roles',    'modulo': 'roles'},
    {'codigo': 'roles.crear',     'nombre': 'Crear rol',       'modulo': 'roles'},
    {'codigo': 'roles.editar',    'nombre': 'Editar rol',      'modulo': 'roles'},
    {'codigo': 'roles.eliminar',  'nombre': 'Eliminar rol',    'modulo': 'roles'},
    {'codigo': 'permisos.listar', 'nombre': 'Listar permisos', 'modulo': 'permisos'},
    {'codigo': 'permisos.crear',  'nombre': 'Crear permiso',   'modulo': 'permisos'},
    {'codigo': 'permisos.editar', 'nombre': 'Editar permiso',  'modulo': 'permisos'},

    # Pacientes
    {'codigo': 'pacientes.listar',   'nombre': 'Listar pacientes',   'modulo': 'pacientes'},
    {'codigo': 'pacientes.crear',    'nombre': 'Crear paciente',     'modulo': 'pacientes'},
    {'codigo': 'pacientes.editar',   'nombre': 'Editar paciente',    'modulo': 'pacientes'},
    {'codigo': 'pacientes.eliminar', 'nombre': 'Eliminar paciente',  'modulo': 'pacientes'},

    # Especialistas / horarios
    {'codigo': 'especialistas.listar',   'nombre': 'Listar especialistas',   'modulo': 'especialistas'},
    {'codigo': 'especialistas.crear',    'nombre': 'Crear especialista',     'modulo': 'especialistas'},
    {'codigo': 'especialistas.editar',   'nombre': 'Editar especialista',    'modulo': 'especialistas'},
    {'codigo': 'especialistas.eliminar', 'nombre': 'Eliminar especialista',  'modulo': 'especialistas'},

    # Médicos
    {'codigo': 'medicos.listar',   'nombre': 'Listar médicos',   'modulo': 'medicos'},
    {'codigo': 'medicos.crear',    'nombre': 'Crear médico',     'modulo': 'medicos'},
    {'codigo': 'medicos.editar',   'nombre': 'Editar médico',    'modulo': 'medicos'},
    {'codigo': 'medicos.eliminar', 'nombre': 'Eliminar médico',  'modulo': 'medicos'},

    # Citas
    {'codigo': 'citas.listar',       'nombre': 'Listar citas',       'modulo': 'citas'},
    {'codigo': 'citas.crear',        'nombre': 'Crear cita',         'modulo': 'citas'},
    {'codigo': 'citas.reprogramar',  'nombre': 'Reprogramar cita',   'modulo': 'citas'},
    {'codigo': 'citas.cancelar',     'nombre': 'Cancelar cita',      'modulo': 'citas'},

    # Agenda
    {'codigo': 'agenda.ver',         'nombre': 'Ver agenda médica',  'modulo': 'agenda'},

    # Consultas
    {'codigo': 'consultas.listar',   'nombre': 'Listar consultas',   'modulo': 'consultas'},
    {'codigo': 'consultas.crear',    'nombre': 'Registrar consulta', 'modulo': 'consultas'},

    # Dashboard / reportes
    {'codigo': 'dashboard.ver',      'nombre': 'Ver dashboard clínico',  'modulo': 'dashboard'},
    {'codigo': 'reportes.ver',       'nombre': 'Ver reportes clínicos',  'modulo': 'reportes'},
]


def run():
    creados = 0
    existentes = 0

    for data in PERMISOS:
        _, created = Permiso.objects.get_or_create(
            codigo=data['codigo'],
            defaults={
                'nombre': data['nombre'],
                'modulo': data['modulo'],
            },
        )
        if created:
            creados += 1
        else:
            existentes += 1

    return creados, existentes
