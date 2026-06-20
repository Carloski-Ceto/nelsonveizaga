# Sesion 2026-04-30 - RBAC UI clinico transversal

## Objetivo
Aplicar una politica de autorizacion por rol en UI para acciones de escritura en modulos clinicos principales y evitar duplicacion de reglas.

## Implementacion
- Nuevo helper reusable: `frontend/src/lib/authorization.ts`
  - `canWriteModule(me, module)`
  - modulos: `pacientes`, `especialistas`, `citas`, `consultas`
  - politica de escritura:
    - `pacientes`, `especialistas`, `citas`: `ADMIN`, `ADMINISTRATIVO`
    - `consultas`: `ADMIN`, `MEDICO`, `ESPECIALISTA`

- Modulos actualizados:
  - `frontend/src/app/dashboard/pacientes/page.tsx`
  - `frontend/src/app/dashboard/especialistas/page.tsx`
  - `frontend/src/app/dashboard/citas/page.tsx`
  - `frontend/src/app/dashboard/consultas/page.tsx`

## Comportamiento UI
- Acciones de escritura deshabilitadas cuando el rol no tiene permisos.
- Mensaje de modo solo lectura visible por modulo.
- Guardas defensivos en handlers para evitar ejecucion manual sin permisos.

## Validacion
- `npm run build` -> OK.
