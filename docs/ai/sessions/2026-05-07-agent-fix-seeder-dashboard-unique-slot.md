# Sesión: fix seeder dashboard unique slot

## Fecha
2026-05-07

## Problema
`python manage.py seed` fallaba en `seed_dashboard_demo` con `IntegrityError` por restricción única:
`uq_cita_especialista_fecha_hora_activa`.

## Causa
El seeder usaba `get_or_create` por `(paciente, especialista, fecha_hora_inicio)` y podía intentar insertar una cita activa (`PROGRAMADA/CONFIRMADA`) en un slot donde ya existía otra cita activa del mismo especialista y hora.

## Solución
- Se añadió control previo de colisión para estados activos.
- Si el slot activo ya existe, el seeder cuenta como existente y continúa.

Archivo modificado:
- `backend/seeders/seed_dashboard_demo.py`

## Validación
- `docker compose exec backend python manage.py seed --only dashboard-demo` -> OK.
- `docker compose exec backend python manage.py seed` -> OK, sin `IntegrityError`.
