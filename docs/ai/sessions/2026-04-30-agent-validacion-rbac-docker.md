# Sesion 2026-04-30 - Validacion RBAC Docker

## Objetivo
Validar en entorno Docker el nuevo endpoint de permisos efectivos y su comportamiento con usuarios seed.

## Ejecuciones
- `docker compose up -d --build` -> OK (warning: `INTERNAL_API_URL` no seteada).
- `docker compose exec backend python manage.py makemigrations` -> sin cambios.
- `docker compose exec backend python manage.py migrate` -> sin migraciones pendientes.
- `docker compose exec backend python manage.py seed` -> OK.
- `docker compose exec backend python manage.py check` -> OK.

## Prueba endpoint permisos
- `GET /api/auth/permissions/` sin token -> `401` (esperado).
- Login `admin/admin123` y `dr.carlos/medico123` -> ambos `200` con:
  - `permissions: []`
  - `roles: []`

## Hallazgo
No existen asignaciones en `usuario_rol` para usuarios seed probados, por eso los permisos efectivos son vacíos.

## Acción recomendada
Crear seeder de asignación usuario-rol para usuarios base (admin y clínicos) y luego revalidar endpoint para cerrar RBAC real por permisos.
