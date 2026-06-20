# Sesion 2026-04-30 - Permisos clinicos finos

## Objetivo
Implementar RBAC clínico fino por acción con códigos explícitos y eliminar heurísticas en frontend.

## Backend
- `backend/seeders/seed_permisos.py`
  - se agregaron permisos clínicos:
    - `pacientes.listar/crear/editar/eliminar`
    - `especialistas.listar/crear/editar/eliminar`
    - `citas.listar/crear/reprogramar/cancelar`
    - `consultas.listar/crear`
    - `agenda.ver`
    - `kpi.ver`

- `backend/seeders/seed_rbac_asignaciones.py`
  - se actualizaron asignaciones `rol_permiso` para incluir permisos clínicos.

## Frontend
- `frontend/src/lib/authorization.ts`
  - se removió evaluación heurística por alias (`includes`).
  - ahora usa mapas explícitos de códigos permitidos por módulo y modo (view/write).

## Validación
- `docker compose exec backend python manage.py seed --only permisos` -> OK.
- `docker compose exec backend python manage.py seed --only rbac` -> OK.
- `GET /api/auth/permissions` validado con usuarios seed:
  - admin: 29 permisos
  - dr.carlos: 10 permisos
- `npm run build` -> OK.

## Nota
- Política clínica final por perfil (médico/especialista/administrativo) aún debe afinarse con roles clínicos dedicados para evitar mezclar permisos IAM con flujos asistenciales.
