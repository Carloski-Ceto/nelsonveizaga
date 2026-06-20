# Session Log - 2026-05-30 - seeders-6m-masivos-reportes

## Objetivo
Aumentar significativamente el volumen de datos demo para que los reportes tengan sentido analítico en ventana de 6 meses.

## Cambios
- `backend/seeders/seed_clinica.py`
  - Se agrega generación idempotente de pacientes sintéticos (`PACIENTES_GENERADOS_OBJETIVO=60`).
- `backend/seeders/seed_dashboard_demo.py`
  - Se incrementa densidad temporal en 6 meses (cada 3 días) y se amplía ventana futura.
  - Se amplía pool de pacientes usados por citas demo.
- `backend/seeders/seed_consultas_demo.py`
  - `CONSULTAS_OBJETIVO` sube a `360`.
  - Se agrega función de autocompletado de citas cuando no hay suficientes para cumplir objetivo.

## Ejecución y resultados
- `seed --only clinica` -> 60 creados, 20 existentes.
- `seed --only dashboard-demo` -> 132 creados, 2 existentes.
- `seed --only consultas-demo` -> 494 creados, 63 existentes.
- Conteo final en base actual:
  - pacientes: 72
  - citas: 412
  - consultas: 360
