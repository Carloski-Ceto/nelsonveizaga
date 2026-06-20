# Sesion 2026-04-29 - Frontend modulo pacientes

## Objetivo
Implementar en el panel web el primer módulo clínico conectado a la API real, respetando paleta visual y tipografías del sistema.

## Cambios realizados
- Nueva ruta: `frontend/src/app/dashboard/pacientes/page.tsx`.
- Nuevos estilos: `frontend/src/app/dashboard/pacientes/page.module.css`.
- Sidebar actualizado con acceso `Pacientes` en `frontend/src/components/Sidebar.tsx`.

## Alcance funcional
- Listado paginado de pacientes contra `GET /api/pacientes`.
- Busqueda (`search`) por nombre/apellido/documento/contacto.
- Filtros por `sexo` y `activo`.
- Alta de paciente (`POST /api/pacientes`).
- Edicion de paciente (`PATCH /api/pacientes/{id}`).
- Eliminacion de paciente (`DELETE /api/pacientes/{id}`).
- Manejo de errores API por campo y errores globales.

## Validacion
- `npm run build` en `frontend/` ejecutado con exito.
- Ruta generada en build: `/dashboard/pacientes`.

## Siguiente paso recomendado
Reusar el mismo patron de pagina (toolbar + tabla + modal + estados) para `especialistas` y luego `citas` con acciones de negocio (reprogramar/cancelar).
