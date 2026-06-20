# Sesión: seeder dashboard demo + verificación API

## Fecha
2026-05-07

## Objetivo
Agregar seeders adicionales para validar dashboard con datos no triviales y comprobar funcionamiento tras reinicio total de Docker/DB.

## Cambios realizados
- Se integró nuevo objetivo de seed en comando central:
  - `backend/apps/core/management/commands/seed.py`
  - opción nueva: `dashboard-demo`.
- Se creó nuevo seeder:
  - `backend/seeders/seed_dashboard_demo.py`
  - genera citas históricas/futuras con estados mixtos (`PROGRAMADA`, `CONFIRMADA`, `ATENDIDA`, `CANCELADA`, `REPROGRAMADA`).
  - idempotente por `get_or_create` sobre `(paciente, especialista, fecha_hora_inicio)`.

## Ejecución y verificación
- `docker compose exec backend python manage.py seed --only dashboard-demo` -> OK (`24 creados`).
- Login API con usuario seed `admin` y validación de endpoints:
  - `GET /api/dashboard/summary` -> OK (métricas con datos)
  - `GET /api/dashboard/operativo` -> OK
  - `GET /api/dashboard/citas-drilldown?page=1&page_size=5` -> OK
  - `GET /api/dashboard/citas-drilldown/export` -> OK (`200`, `text/csv`, attachment)

## Resultado
- Dashboard funcional y verificable con dataset analítico reproducible luego de reset completo de entorno.
