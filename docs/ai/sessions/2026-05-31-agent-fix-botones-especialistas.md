# Sesión: Fix botones en Especialistas

Fecha: 2026-05-31

## Problema reportado
En la pestaña de Especialistas, los botones de creación parecían no funcionar.

## Causa raíz
Las funciones `addEspecialista` y `addHorario` hacían `return` silencioso cuando faltaban campos (`id_usuario` / `id_especialista`), sin mensaje de feedback.

## Solución
- Se agregaron validaciones explícitas con mensajes de error.
- Se agregaron banderas `canSubmitEspecialista` y `canSubmitHorario`.
- Los botones `Crear especialista` y `Crear horario` se deshabilitan hasta cumplir campos mínimos.

## Archivo modificado
- `frontend/src/app/dashboard/especialistas/page.tsx`

## Validación
- `docker compose exec frontend npm run lint` ✅
