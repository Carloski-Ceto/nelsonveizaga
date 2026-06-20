# Sesion 2026-04-29 - Mini plan frontend clinico

## Objetivo
Ejecutar un mini plan por fases para dejar operativo el frontend clínico sobre endpoints del dominio.

## Fases implementadas

### Fase 1 - Sesion robusta
- `frontend/src/lib/api.ts`: interceptor 401 con refresh automatico (`/api/auth/token/refresh/`) y reintento de solicitud original.

### Fase 2 - Especialistas y horarios
- Nueva ruta `frontend/src/app/dashboard/especialistas/page.tsx`.
- Consumo de:
  - `GET/POST/DELETE /api/especialistas`
  - `GET/POST/DELETE /api/horarios-especialista`

### Fase 3 - Citas, agenda y consultas
- Nueva ruta `frontend/src/app/dashboard/citas/page.tsx`.
- Nueva ruta `frontend/src/app/dashboard/agenda-medica/page.tsx`.
- Nueva ruta `frontend/src/app/dashboard/consultas/page.tsx`.
- Acciones implementadas:
  - Programar cita (`POST /api/citas`)
  - Reprogramar (`POST /api/citas/{id}/reprogramar`)
  - Cancelar (`POST /api/citas/{id}/cancelar`)
  - Registrar consulta (`POST /api/consultas-medicas`)

## Estilo y navegacion
- Nuevo estilo compartido: `frontend/src/app/dashboard/clinic.module.css`.
- Sidebar actualizado: `frontend/src/components/Sidebar.tsx` con accesos clinicos.

## Validacion
- Comando ejecutado: `npm run build` en `frontend/`.
- Resultado: build exitoso, rutas nuevas generadas.

## Pendiente siguiente iteracion
- Reemplazar prompts (`window.prompt`) de reprogramar/cancelar por modales accesibles.
- Enriquecer tablas con nombres (no solo IDs) y filtros server-side avanzados.
- Aplicar autorizacion fina por rol/permiso en botones de accion.
