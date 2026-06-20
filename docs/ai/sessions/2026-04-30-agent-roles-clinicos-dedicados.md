# Sesion 2026-04-30 - Roles clinicos dedicados

## Objetivo
Refinar politica RBAC para separar privilegios IAM de flujos clinicos asistenciales.

## Implementacion
- `backend/seeders/seed_roles.py`
  - nuevos roles:
    - `Recepción Clínica`
    - `Médico Clínico`
    - `Especialista Clínico`

- `backend/seeders/seed_rbac_asignaciones.py`
  - ajuste de `ROLE_PERMISSION_CODES`:
    - `Operador IAM` queda solo IAM.
    - `Auditor` queda enfocado en auditoria/IAM lectura.
    - roles clínicos dedicados con permisos clínicos explícitos.
  - ajuste de `USER_ROLE_NAMES` seed:
    - `admin` -> `Administrador del Sistema`
    - `dr.carlos` -> `Médico Clínico`
    - `dra.andrea` -> `Especialista Clínico`
  - sincronizacion con limpieza de sobrantes:
    - `rol_permiso` elimina permisos no deseados del rol.
    - `usuario_rol` elimina roles no deseados en usuarios seed.

## Validacion Docker
- `seed --only roles` -> `3 creados, 4 existentes`.
- `seed --only rbac` -> `27 creados, 42 existentes`.
- `/api/auth/permissions`:
  - `admin`: 29 permisos, rol `Administrador del Sistema`.
  - `dr.carlos`: 7 permisos, rol `Médico Clínico`.
  - `dra.andrea`: 7 permisos, rol `Especialista Clínico`.
  - comprobacion: medico no tiene `users.crear`; especialista mantiene `consultas.crear`.
