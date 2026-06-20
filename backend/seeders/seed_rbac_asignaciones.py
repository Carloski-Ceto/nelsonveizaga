"""
seeders/seed_rbac_asignaciones.py
Puebla asignaciones RBAC base para entorno dev:
- permisos por rol (rol_permiso)
- roles por usuario (usuario_rol)

Idempotente: usa get_or_create.
"""

from apps.Usuarios.permisos.models import Permiso
from apps.Usuarios.roles.models import Rol, RolPermiso, UsuarioRol
from apps.Usuarios.users.models import Usuario


ROLE_PERMISSION_CODES = {
    'Administrador del Sistema': [
        'users.listar', 'users.ver', 'users.crear', 'users.editar', 'users.eliminar',
        'bitacora.ver',
        'roles.listar', 'roles.crear', 'roles.editar', 'roles.eliminar',
        'permisos.listar', 'permisos.crear', 'permisos.editar',
        'pacientes.listar', 'pacientes.crear', 'pacientes.editar', 'pacientes.eliminar',
        'especialistas.listar', 'especialistas.crear', 'especialistas.editar', 'especialistas.eliminar',
        'medicos.listar', 'medicos.crear', 'medicos.editar', 'medicos.eliminar',
        'citas.listar', 'citas.crear', 'citas.reprogramar', 'citas.cancelar',
        'agenda.ver',
        'consultas.listar', 'consultas.crear',
        'dashboard.ver',
        'reportes.ver',
        'historialclinico.listar', 'historialclinico.archivar', 'historialclinico.restaurar',
    ],
    'Operador IAM': [
        'users.listar', 'users.ver', 'users.crear', 'users.editar',
        'roles.listar',
        'permisos.listar',
    ],
    'Auditor': [
        'bitacora.ver',
        'users.ver',
        'roles.listar',
        'permisos.listar',
    ],
    'Usuario estándar': [
        'users.ver',
        'agenda.ver',
    ],
    'Recepción Clínica': [
        'pacientes.listar', 'pacientes.crear', 'pacientes.editar', 'pacientes.eliminar',
        'especialistas.listar',
        'medicos.listar',
        'citas.listar', 'citas.crear', 'citas.reprogramar',
        'agenda.ver',
        'dashboard.ver',
        'reportes.ver',
    ],
    'Médico Clínico': [
        'pacientes.listar', 'pacientes.crear',
        'especialistas.listar',
        'medicos.listar',
        'citas.listar', 'citas.crear',
        'agenda.ver',
        'consultas.listar', 'consultas.crear',
        'historialclinico.listar', 'historialclinico.archivar',
    ],
    'Especialista Clínico': [
        'pacientes.listar',
        'especialistas.listar',
        'medicos.listar',
        'citas.listar',
        'agenda.ver',
        'consultas.listar', 'consultas.crear',
        'reportes.ver',
        'historialclinico.listar',
    ],
}

USER_ROLE_NAMES = {
    'admin': ['Administrador del Sistema'],
    'dr.carlos': ['Médico Clínico'],
    'dr.luis': ['Médico Clínico'],
    'dr.renzo': ['Médico Clínico'],
    'ceto': ['Médico Clínico'],
    'dra.andrea': ['Especialista Clínico'],
}


def run():
    creados = 0
    existentes = 0

    # 1) Sincronizar permisos por rol (agrega faltantes y elimina sobrantes)
    for role_name, perm_codes in ROLE_PERMISSION_CODES.items():
        try:
            rol = Rol.objects.get(nombre=role_name)
        except Rol.DoesNotExist:
            existentes += len(perm_codes)
            continue

        wanted_ids = set()
        for code in perm_codes:
            try:
                permiso = Permiso.objects.get(codigo=code)
            except Permiso.DoesNotExist:
                existentes += 1
                continue
            wanted_ids.add(permiso.id_permiso)

            _, created = RolPermiso.objects.get_or_create(id_rol=rol, id_permiso=permiso)
            creados += int(created)
            existentes += int(not created)

        current = RolPermiso.objects.filter(id_rol=rol).select_related('id_permiso')
        for row in current:
            if row.id_permiso.id_permiso not in wanted_ids:
                row.delete()

    # 2) Sincronizar roles de usuarios base (sin mezcla IAM-clínico accidental)
    for username, role_names in USER_ROLE_NAMES.items():
        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            existentes += len(role_names)
            continue

        wanted_role_ids = set()
        for role_name in role_names:
            try:
                rol = Rol.objects.get(nombre=role_name)
            except Rol.DoesNotExist:
                existentes += 1
                continue
            wanted_role_ids.add(rol.id_rol)

            _, created = UsuarioRol.objects.get_or_create(id_usuario=user, id_rol=rol)
            creados += int(created)
            existentes += int(not created)

        current_user_roles = UsuarioRol.objects.filter(id_usuario=user).select_related('id_rol')
        for row in current_user_roles:
            if row.id_rol.id_rol not in wanted_role_ids:
                row.delete()

    return creados, existentes
