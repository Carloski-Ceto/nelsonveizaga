# Sesion 2026-04-29 - KPI paginacion export presets

## Objetivo
Completar capa analitica KPI con mejor experiencia de exploracion y salida de datos.

## Backend
- `backend/apps/core/kpi_views.py`
  - `kpi_citas_drilldown` ahora paginado (`page`, `page_size`, max 100).
  - nuevo `kpi_citas_drilldown_export` para export CSV filtrado.
  - helper reutilizado de filtros/rango para consistencia.
- `backend/apps/core/urls.py`
  - nueva ruta: `kpi/citas-drilldown/export`.

## Frontend
- `frontend/src/app/dashboard/kpi/page.tsx`
  - presets: Hoy, 7d, 30d, Mes.
  - paginación de drilldown (anterior/siguiente).
  - botón Exportar CSV.
- `frontend/src/app/dashboard/kpi/page.module.css`
  - estilos de presets y paginador responsive.

## Validación
- `docker compose exec backend python manage.py check` -> OK.
- `npm run build` -> OK.
