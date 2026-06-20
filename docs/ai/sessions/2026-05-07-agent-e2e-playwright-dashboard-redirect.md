# Sesión: E2E Playwright redirect dashboard

## Fecha
2026-05-07

## Objetivo
Agregar prueba E2E automática para validar la ruta legacy `/dashboard/dashboard`.

## Implementación
- Se agregó `@playwright/test` en `frontend/package.json`.
- Nuevo script: `npm run test:e2e`.
- Nueva configuración: `frontend/playwright.config.ts`.
  - `testDir`: `tests/e2e`
  - web server local para pruebas en `127.0.0.1:3101`
- Nuevo test: `frontend/tests/e2e/dashboard-redirect.spec.ts`.

## Resultado de ejecución
- `npm run test:e2e` => **1 passed**.

## Observación
- En dev apareció warning de Next sobre `allowedDevOrigins` por host `127.0.0.1`; no bloquea la prueba.
