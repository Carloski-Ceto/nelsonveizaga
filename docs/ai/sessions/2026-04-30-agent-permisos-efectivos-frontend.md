# Sesion 2026-04-30 - Permisos efectivos frontend

## Objetivo
Migrar autorizacion UI desde reglas estaticas por rol hacia evaluacion por codigos de permiso cuando esten disponibles.

## Implementacion
- `frontend/src/contexts/DashboardUserContext.tsx`
  - agrega `permissionCodes: Set<string>` al contexto.
  - en `refresh()`, tras `/api/auth/me`, intenta resolver permisos del usuario:
    - roles de usuario (`/api/users/{id}/roles`)
    - permisos por rol (`/api/roles/{id}/permisos`)
    - catalogo de permisos (`/api/permisos?page=n`) para mapear `id_permiso -> codigo`.
  - si falla, deja conjunto vacio y el sistema usa fallback por rol.

- `frontend/src/lib/authorization.ts`
  - `canWriteModule`, `canViewRoute`, `canViewClinicalModule` aceptan `permissionCodes`.
  - prioridad de decision:
    1) permisos efectivos por codigo,
    2) fallback por `tipo_usuario`.

- Modulos conectados al nuevo esquema:
  - `Sidebar`
  - `pacientes`, `especialistas`, `citas`, `consultas`, `agenda-medica`, `kpi`.

## Validacion
- `npm run build` -> OK.

## Riesgo residual
- La resolucion actual depende de multiples endpoints; conviene endpoint backend unico de permisos efectivos para robustez y menor latencia.
