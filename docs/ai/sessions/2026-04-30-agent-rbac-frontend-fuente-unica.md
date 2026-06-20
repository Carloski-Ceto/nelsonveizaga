# Sesion 2026-04-30 - RBAC frontend fuente unica

## Objetivo
Simplificar resolucion de permisos en frontend y depender solo del endpoint dedicado de permisos efectivos.

## Implementacion
- `frontend/src/contexts/DashboardUserContext.tsx`
  - removido fallback legacy (roles -> permisos -> catalogo).
  - `resolvePermissionCodes` ahora consume solo `GET /api/auth/permissions`.
  - si falla, devuelve conjunto vacio y la UI mantiene comportamiento seguro (sin permisos efectivos).

## Validacion
- `npm run build` -> OK.

## Resultado
- Menos complejidad en contexto de sesion.
- RBAC frontend alineado a contrato backend unico para permisos efectivos.
