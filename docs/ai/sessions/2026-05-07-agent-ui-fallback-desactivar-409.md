# Sesion 2026-05-07 - UI fallback desactivar por 409

## Objetivo
Eliminar friccion de usuario cuando delete de pacientes/especialistas falla por historial protegido.

## Cambios
- Frontend pacientes (`frontend/src/app/dashboard/pacientes/page.tsx`):
  - `remove()` detecta `status 409` y ofrece desactivar registro.
  - nueva accion `deactivate()` con `PATCH /api/pacientes/{id}` `{ activo: false }`.
  - nuevo boton `Desactivar` en tabla.

- Frontend especialistas (`frontend/src/app/dashboard/especialistas/page.tsx`):
  - `removeEspecialista()` detecta `status 409` y ofrece desactivar.
  - nueva accion `deactivateEspecialista()` con `PATCH /api/especialistas/{id}` `{ activo: false }`.
  - nuevo boton `Desactivar` en tabla.

## Validacion
- `docker compose exec backend python manage.py test apps.especialistas.tests apps.pacientes.tests --noinput` -> OK (4 tests).
- `npm run lint` -> OK con warnings previos no relacionados (`react-hooks/exhaustive-deps` en citas/kpi).
- `npm run build` -> OK.
