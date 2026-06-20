# Sesion 2026-04-30 - RBAC UI guardas clinicas

## Objetivo
Completar control de acceso UI evitando acceso por URL directa en modulos clinicos.

## Implementacion
- `frontend/src/lib/authorization.ts`
  - agregado `canViewClinicalModule(me, module)`.
  - consolidacion de rutas en `canViewRoute` para Sidebar.

- Guardas de lectura agregadas en:
  - `frontend/src/app/dashboard/pacientes/page.tsx`
  - `frontend/src/app/dashboard/especialistas/page.tsx`
  - `frontend/src/app/dashboard/citas/page.tsx`
  - `frontend/src/app/dashboard/consultas/page.tsx`
  - `frontend/src/app/dashboard/agenda-medica/page.tsx`
  - `frontend/src/app/dashboard/kpi/page.tsx`

## Resultado
- Si el usuario no tiene permiso de vista para el modulo, no se consulta API y se muestra mensaje de acceso denegado en la pantalla.

## Validacion
- `npm run build` -> OK.
