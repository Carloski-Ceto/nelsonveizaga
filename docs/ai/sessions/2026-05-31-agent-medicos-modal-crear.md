# Sesión: módulo médicos - crear por modal

Fecha: 2026-05-31

## Solicitud
Quitar formulario inline (marcado en rojo) y abrir formulario al pulsar `Crear médico`.

## Implementación
- `frontend/src/app/dashboard/medicos/page.tsx`
  - Se elimina el formulario inline superior.
  - Se deja botón `Crear médico` como disparador.
  - Se agrega modal `Registrar nuevo médico` con formulario completo.
  - En creación exitosa, se cierra modal, se limpia formulario y se refresca tabla.

## Validación
- `docker compose exec frontend npm run lint` ✅
