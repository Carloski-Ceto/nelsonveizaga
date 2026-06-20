# Sesion 2026-04-30 - RBAC UI visibilidad sidebar

## Objetivo
Extender la autorizacion frontend de acciones a visibilidad de rutas en navegacion y reforzar acceso por URL directa.

## Implementacion
- `frontend/src/lib/authorization.ts`
  - nuevo `canViewRoute(me, href)` para decidir visibilidad de rutas en Sidebar.
  - nuevo `canViewClinicalModule(me, module)` para guardas de lectura por modulo.

- `frontend/src/components/Sidebar.tsx`
  - `NAV_ITEMS` ahora se filtra con `canViewRoute`.
  - se removio `adminOnly` como regla aislada y se centralizo en helper.

- `frontend/src/app/dashboard/agenda-medica/page.tsx`
  - guarda de lectura para acceso directo por URL usando `canViewClinicalModule(me, 'agenda')`.

## Validacion
- `npm run build` -> OK.

## Pendiente recomendado
- Sustituir reglas estaticas por permisos backend granulares (por ejemplo, claims/permisos efectivos de API).
