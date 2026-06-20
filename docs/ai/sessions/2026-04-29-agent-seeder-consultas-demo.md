# Sesion 2026-04-29 - Seeder consultas demo

## Objetivo
Agregar un seeder para poblar consultas medicas de ejemplo y validar el flujo clinico completo.

## Cambios
- Nuevo archivo: `backend/seeders/seed_consultas_demo.py`
  - Busca citas en estado `PROGRAMADA` o `CONFIRMADA`.
  - Crea consulta medica idempotente (OneToOne por cita).
  - Marca cita como `ATENDIDA` al crear consulta.
- Integracion en comando seed:
  - `backend/apps/core/management/commands/seed.py`
  - nuevo target: `consultas-demo`

## Ejecucion y resultado
- Comando:
  - `docker compose exec backend python manage.py seed --only consultas-demo`
- Salida:
  - `1 creados, 0 ya existían`

## Uso recomendado
1) `seed --only clinica`
2) `seed --only consultas-demo`

Con eso queda un dataset util para probar UI de pacientes/especialistas/citas/agenda/consultas.
