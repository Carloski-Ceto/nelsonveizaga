# Sesión: E2E RBAC Sidebar

## Fecha
2026-05-07

## Objetivo
Validar en E2E que la visibilidad del Sidebar respete permisos/rol de sesión.

## Cambios
- Se amplió `frontend/tests/e2e/dashboard-redirect.spec.ts` con helpers de mock:
  - `GET /api/auth/me`
  - `GET /api/auth/permissions`
- Nuevos casos:
  - ADMIN ve links IAM (`Usuarios`, `Roles`, `Permisos`).
  - MEDICO no ve links IAM y sí ve `Agenda médica`.
- Selectores scopeados a `nav[aria-label="Menú principal"]` para evitar falsos positivos por links de contenido.

## Validación
- `npm run test:e2e` => **5 passed**.
