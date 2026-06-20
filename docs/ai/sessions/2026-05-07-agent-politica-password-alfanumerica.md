# Sesion 2026-05-07 - Politica de password alfanumerica estricta

## Objetivo
Exigir contrasena con mayuscula, minuscula y numero, permitiendo solo caracteres alfanumericos (sin simbolos ni espacios).

## Cambios
- Backend:
  - Nuevo archivo `backend/apps/users/password_validators.py` con `AlphanumericComplexityValidator`.
  - Integracion del validador en `backend/config/settings.py` dentro de `AUTH_PASSWORD_VALIDATORS`.

- Frontend (mensajeria UX):
  - `frontend/src/app/dashboard/contrasena/page.tsx`: texto de reglas actualizado.
  - `frontend/src/app/forgot-password/page.tsx`: ayuda visible con la nueva politica.

## Validacion
- `docker compose exec backend python manage.py check` -> OK.
- `npm run build` (frontend) -> OK.
