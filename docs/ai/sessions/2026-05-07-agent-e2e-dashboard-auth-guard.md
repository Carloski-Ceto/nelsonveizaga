# Sesión: E2E guard de sesión dashboard

## Fecha
2026-05-07

## Objetivo
Validar con pruebas E2E que el guard de `/dashboard` funcione correctamente con y sin token.

## Cambios
- Se amplió `frontend/tests/e2e/dashboard-redirect.spec.ts` con dos casos nuevos:
  - `/dashboard` sin token -> redirige a `/login`.
  - `/dashboard` con `access_token` en localStorage -> permanece en `/dashboard`.

## Validación
- `npm run test:e2e` => **3 passed**.

## Resultado
- Se confirma comportamiento esperado del guard de sesión del layout dashboard en navegación real de navegador automatizado.
