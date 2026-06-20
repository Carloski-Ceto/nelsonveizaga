# Session Log - 2026-05-30 - seeders-6m-y-ui-reportes-sin-cu

## Objetivo
- Aumentar volumen temporal de seeders para reportes (6 meses).
- Quitar menciones `CUxx` en UI de reportes.

## Cambios
- `backend/seeders/seed_dashboard_demo.py`
  - Ventana semanal de ~6 meses hacia atrás + corto futuro.
- `backend/seeders/seed_consultas_demo.py`
  - `CONSULTAS_OBJETIVO` aumentado a `120`.
  - Incluye citas en estado `ATENDIDA` además de `PROGRAMADA/CONFIRMADA`.
- `frontend/src/app/dashboard/reportes/page.tsx`
  - Removidas etiquetas `CU21/CU22/CU23` de descripción y títulos.

## Ejecución
- `docker compose exec backend python manage.py seed --only dashboard-demo` -> `58 creados`.
- `docker compose exec backend python manage.py seed --only consultas-demo` -> `62 creados`.
- `docker compose exec frontend npm run lint` -> OK.
