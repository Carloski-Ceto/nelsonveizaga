# Sesion 2026-05-07 - Fix delete especialista con dependencias

## Objetivo
Resolver error al eliminar especialistas cuando existen citas/consultas relacionadas.

## Cambios
- `backend/apps/especialistas/views.py`
  - `destroy()` ahora captura `ProtectedError` y responde `409 Conflict` con mensaje de negocio.

- Tests nuevos:
  - `backend/apps/especialistas/tests/test_delete_especialista.py`
    - elimina sin dependencias -> `204`
    - elimina con cita asociada -> `409`
  - `backend/apps/especialistas/tests/__init__.py`

## Validación
- `docker compose exec backend python manage.py test apps.especialistas.tests --noinput` -> OK (2 tests).

## Nota operativa
- Evitar correr `manage.py test` y `pytest` en paralelo por conflicto de test DB (`test_oftalmologia_si1_db`).
