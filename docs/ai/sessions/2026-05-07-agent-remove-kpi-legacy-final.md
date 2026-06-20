# Sesion 2026-05-07 - Remocion final de legado KPI

## Objetivo
Completar limpieza final de legado KPI, dejando naming y rutas unificadas en Dashboard.

## Cambios principales
- Frontend:
  - Eliminada ruta `frontend/src/app/dashboard/kpi/page.tsx`.
  - Eliminado estilo `frontend/src/app/dashboard/kpi/page.module.css`.
  - Nuevo estilo en `frontend/src/app/dashboard/dashboard/page.module.css`.
  - `DashboardNavbar` y `authorization.ts` sin referencias `/dashboard/kpi`.
  - `dashboard/dashboard/page.tsx` ya no importa estilos de carpeta KPI.

- Backend:
  - Eliminado `backend/apps/core/kpi_views.py` legacy.
  - `seed_permisos` elimina `kpi.ver` y mantiene `dashboard.ver`.
  - Limpieza de datos: `kpi.ver` removido de base (`Permiso` + `RolPermiso`).

## Validacion
- `docker compose exec backend python manage.py check` -> OK
- `docker compose exec backend python manage.py seed --only permisos` -> OK
- `docker compose exec backend python manage.py seed --only rbac` -> OK
- `npm run lint` -> OK
- `npm run build` -> OK
