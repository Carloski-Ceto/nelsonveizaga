# Sesion 2026-04-30 - Politica clinica por accion

## Objetivo
Ajustar RBAC clínico a reglas de negocio más finas por acción.

## Cambios
- `backend/seeders/seed_rbac_asignaciones.py`
  - `Recepción Clínica`: se removió `citas.cancelar`.
  - `Médico Clínico` y `Especialista Clínico`: se removió `kpi.ver`.

- `frontend/src/lib/authorization.ts`
  - nuevo helper `canWriteCitaAction(me, action, permissionCodes)`.

- `frontend/src/app/dashboard/citas/page.tsx`
  - permisos separados por acción:
    - `canCreateCitas`
    - `canReprogramCitas`
    - `canCancelCitas`
  - botones y handlers alineados a permiso específico.

## Validación
- `docker compose exec backend python manage.py seed --only rbac` -> OK.
- `/api/auth/permissions`:
  - `dr.carlos` (Médico Clínico): sin `kpi.ver`.
  - `dra.andrea` (Especialista Clínico): sin `kpi.ver` y sin `citas.cancelar`.
- `npm run build` -> OK.
