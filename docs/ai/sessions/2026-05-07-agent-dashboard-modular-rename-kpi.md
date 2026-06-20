# Sesion 2026-05-07 - Dashboard modular y rename KPI

## Objetivo
Quitar nombre KPI en UI principal y consolidar modulo analitico como Dashboard con backend modular.

## Cambios backend
- Nueva app: `backend/apps/dashboard/`
  - `apps.py`
  - `urls.py`
  - `views.py`
- Rutas nuevas:
  - `GET /api/dashboard/summary`
  - `GET /api/dashboard/operativo`
  - `GET /api/dashboard/citas-drilldown`
  - `GET /api/dashboard/citas-drilldown/export`
- Integracion:
  - `backend/config/settings.py` agrega `apps.dashboard`
  - `backend/config/urls.py` incluye `apps.dashboard.urls`
  - `backend/apps/core/urls.py` queda solo con `health/`
- RBAC:
  - `seed_permisos`: agrega `dashboard.ver` y mantiene `kpi.ver` legacy
  - `seed_rbac_asignaciones`: asigna `dashboard.ver`

## Cambios frontend
- `dashboard` analitico principal ahora en:
  - `frontend/src/app/dashboard/dashboard/page.tsx`
- Ruta principal `/dashboard` renderiza dashboard analitico.
- Panel rapido administrativo movido a:
  - `frontend/src/app/dashboard/inicio/page.tsx`
- Alias legacy:
  - `frontend/src/app/dashboard/kpi/page.tsx` apunta al dashboard analitico.
- Navegacion:
  - Sidebar: `Dashboard`, `Inicio`, `Dashboard clinico` (sin etiqueta KPI)
  - Navbar: nombres de pagina actualizados.
- Autorizacion:
  - `frontend/src/lib/authorization.ts`: modulo `dashboard` + compatibilidad `kpi.ver`.

## Validacion
- `docker compose exec backend python manage.py check` -> OK
- `docker compose exec backend python manage.py seed --only permisos` -> OK
- `docker compose exec backend python manage.py seed --only rbac` -> OK
- `npm run lint` -> OK
- `npm run build` -> OK
- Smoke API `GET /api/dashboard/*` autenticado -> OK
