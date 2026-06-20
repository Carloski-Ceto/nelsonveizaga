# Sesion 2026-04-29 - Fix seed consultas fallback

## Problema
`python manage.py seed` fallaba cuando `consultas-demo` no encontraba citas `PROGRAMADA/CONFIRMADA`.

## Solucion
- `backend/seeders/seed_consultas_demo.py` ahora implementa fallback:
  - busca paciente y especialista existentes,
  - crea cita futura minima en estado `PROGRAMADA`,
  - crea consulta demo y marca cita `ATENDIDA`.

## Validacion
- Comando ejecutado: `docker compose exec backend python manage.py seed`
- Resultado: exitoso, sin excepcion.
