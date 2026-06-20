# Sesion 2026-04-30 - Endpoint auth permissions

## Objetivo
Agregar un endpoint backend unico para permisos efectivos de la sesion y conectarlo en frontend.

## Backend
- Nuevo archivo: `backend/apps/auth/views/permissions.py`
  - `MePermissionsView` (`IsAuthenticated`)
  - retorna:
    - `permissions`: codigos efectivos normalizados en minuscula
    - `roles`: nombres de roles de la sesion
- Integracion:
  - `backend/apps/auth/views/__init__.py`
  - `backend/apps/auth/urls.py` (`/api/auth/permissions`)

## Frontend
- `frontend/src/contexts/DashboardUserContext.tsx`
  - `resolvePermissionCodes` ahora intenta primero `/api/auth/permissions`.
  - mantiene fallback legacy (roles -> permisos -> catalogo) para compatibilidad temporal.

## Validacion
- `npm run build` -> OK.
- `docker compose exec backend python manage.py check` -> no ejecutado por daemon Docker no disponible en la sesion.
