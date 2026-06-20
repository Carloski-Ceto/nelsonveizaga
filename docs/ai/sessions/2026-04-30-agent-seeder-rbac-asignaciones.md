# Sesion 2026-04-30 - Seeder RBAC asignaciones

## Objetivo
Cerrar validacion RBAC efectiva poblando asignaciones faltantes en entorno dev.

## Implementacion
- Nuevo seeder: `backend/seeders/seed_rbac_asignaciones.py`
  - crea asignaciones `rol_permiso` por rol base.
  - crea asignaciones `usuario_rol` para usuarios seed.
- Integracion en comando seed:
  - `backend/apps/core/management/commands/seed.py`
  - nueva opcion `--only rbac`.

## Ejecucion y validacion
- `docker compose exec backend python manage.py seed --only rbac` -> `27 creados, 0 existentes`.
- Prueba endpoint `GET /api/auth/permissions/`:
  - `admin` -> rol `Administrador del Sistema`, `13` permisos.
  - `dr.carlos` -> rol `Auditor`, `4` permisos (`bitacora.ver`, `users.ver`, `roles.listar`, `permisos.listar`).

## Resultado
RBAC efectivo deja de devolver listas vacias para usuarios seed y queda validable end-to-end en Docker.
