# Sesion 2026-05-07 - Tests modulos (password + RBAC)

## Objetivo
Levantar base de pruebas automáticas y estabilizar validación de frontend/lint.

## Cambios
- Backend:
  - `backend/pytest.ini`
  - `backend/apps/users/tests/test_password_policy.py`
  - `backend/apps/users/tests/test_users_password_policy_api.py`
  - `backend/apps/auth/tests/test_permissions_endpoint.py`
  - `backend/apps/users/tests/__init__.py`
  - `backend/apps/auth/tests/__init__.py`

- Frontend:
  - `frontend/.eslintrc.json` para lint no interactivo.
  - Fix lint error previo en `frontend/src/lib/authorization.ts` (`module` -> `clinicalModule`).

## Validaciones
- `docker compose exec backend pytest -q` -> 11 passed.
- `docker compose exec backend python manage.py test` -> detecta 11 tests, falla por issue de test DB en entorno actual (`test_oftalmologia_si1_db` no existe tras drop/rename).
- `npm run lint` -> OK con warnings (`react-hooks/exhaustive-deps` en citas/kpi).
- `npm run build` -> OK (warnings no bloqueantes).
