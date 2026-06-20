# Sesion 2026-04-29 - KPI dashboard responsivo

## Objetivo
Implementar dashboard KPI clinico end-to-end (backend + frontend) con foco en responsividad completa.

## Backend
- Nuevo archivo: `backend/apps/core/kpi_views.py`
  - `GET /api/kpi/summary`:
    - pacientes activos
    - citas del mes
    - atendidas/canceladas
    - porcentajes de atencion y cancelacion
    - distribucion por estado y tactico (reprogramadas/canceladas)
  - `GET /api/kpi/operativo`:
    - metricas de hoy
    - carga por especialista
    - alertas operativas
- Rutas agregadas en `backend/apps/core/urls.py`.

## Frontend
- Nueva ruta: `frontend/src/app/dashboard/kpi/page.tsx`
- Estilos: `frontend/src/app/dashboard/kpi/page.module.css`
- Acceso en navegación: `frontend/src/components/Sidebar.tsx`.

## Responsividad
- Breakpoints implementados:
  - <=1100px: reorganiza grid principal a una columna y KPI cards a 2 columnas.
  - <=640px: KPI cards a 1 columna y cabeceras de panel adaptadas a vertical.
- Tablas en contenedor con `overflow: auto` para evitar cortes en pantallas pequeñas.

## Verificacion
- `docker compose exec backend python manage.py check` -> OK.
- `npm run build` en frontend -> OK, ruta `/dashboard/kpi` generada.
