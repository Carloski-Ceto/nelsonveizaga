# Sesion 2026-05-07 - Fix lint hooks citas y kpi

## Objetivo
Dejar lint frontend limpio corrigiendo dependencias de `useEffect`.

## Cambios
- `frontend/src/app/dashboard/citas/page.tsx`
  - `closeCancelModal` y `closeReschModal` migrados a `useCallback`.
  - `useEffect` de keydown actualizado con dependencias explícitas.

- `frontend/src/app/dashboard/kpi/page.tsx`
  - `useEffect` de carga principal incluye `canViewKpi` en dependencias.

## Validación
- `npm run lint` -> OK (sin warnings ni errores).
- `npm run build` -> OK.
