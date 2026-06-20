# Sesion 2026-04-29 - KPI filtros, drilldown y cache

## Objetivo
Mejorar el módulo KPI con análisis por rango de fechas, detalle de citas y optimización por cache.

## Backend
- `backend/apps/core/kpi_views.py`
  - `kpi/summary` y `kpi/operativo` ahora aceptan `date_from` y `date_to` (YYYY-MM-DD).
  - cache por snapshot con TTL de 5 minutos.
  - nuevo endpoint `GET /api/kpi/citas-drilldown` para detalle por estado/fecha.
- `backend/apps/core/urls.py`
  - ruta agregada: `kpi/citas-drilldown`.

## Frontend
- `frontend/src/app/dashboard/kpi/page.tsx`
  - filtros de fecha en cabecera.
  - click en estado para drilldown.
  - tabla de detalle de citas (id, fecha, estado, paciente, especialista).
- `frontend/src/app/dashboard/kpi/page.module.css`
  - estilos de filtros y botón de interacción.

## Validación
- `docker compose exec backend python manage.py check` -> OK.
- `npm run build` en frontend -> OK.
