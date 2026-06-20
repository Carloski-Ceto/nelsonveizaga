# Sesión: especialistas como médicos (crear por modal)

Fecha: 2026-05-31

## Solicitud
- Mantener en médicos el patrón de crear por modal.
- Replicar el mismo patrón en especialistas.

## Implementación
- `frontend/src/app/dashboard/especialistas/page.tsx`
  - Se eliminaron formularios inline de crear especialista y crear horario.
  - Se agregaron botones disparadores:
    - `Crear especialista` -> abre modal con formulario.
    - `Crear horario` -> abre modal con formulario.
  - Tras crear, el modal se cierra y la tabla se refresca.
  - Se añadió UX de cierre por `ESC` y clic fuera también para modales de edición.
- `frontend/src/app/dashboard/medicos/page.tsx`
  - Se añadió cierre por `ESC` y clic fuera.
  - Foco inicial al abrir modal de creación.

## Validación
- `docker compose exec frontend npm run lint` ✅
