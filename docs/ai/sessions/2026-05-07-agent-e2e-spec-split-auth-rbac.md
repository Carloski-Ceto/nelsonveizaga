# Sesión: split suite E2E auth/rbac

## Fecha
2026-05-07

## Objetivo
Separar pruebas E2E por responsabilidad para mejorar mantenimiento.

## Cambios
- Se eliminó `frontend/tests/e2e/dashboard-redirect.spec.ts`.
- Se creó `frontend/tests/e2e/auth-guard.spec.ts` con 3 casos:
  - redirect de ruta legacy dashboard,
  - guard sin token,
  - guard con token presente.
- Se creó `frontend/tests/e2e/rbac-sidebar.spec.ts` con 2 casos:
  - visibilidad IAM para ADMIN,
  - ocultamiento IAM para MEDICO.

## Validación
- `npm run test:e2e` => **5 passed**.
