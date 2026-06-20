# Sesion 2026-04-30 - Citas modales UX

## Objetivo
Refinar UX del modulo de Citas reemplazando interacciones nativas (`window.prompt`) por modales consistentes con la UI del dashboard.

## Frontend
- `frontend/src/app/dashboard/citas/page.tsx`
  - se eliminaron prompts para cancelar/reprogramar.
  - se agregaron estados React para modal de cancelacion y modal de reprogramacion.
  - nuevas acciones `confirmarCancelar` y `confirmarReprogramar` con validacion minima de campos.
  - la tabla ahora muestra nombres de paciente/especialista (con fallback a ID).

## Validacion
- `npm run build` -> OK.

## Ajustes post code-review
- Se agrego control de doble envio en acciones de confirmar (cancelar/reprogramar).
- Se valido fecha/hora invalida antes de `toISOString()` para evitar errores de runtime.
- Se exigio longitud minima de motivo para mejorar calidad de auditoria operativa.

## Accesibilidad y UX adicional
- Cierre de modal con tecla `Escape`.
- Foco inicial al abrir modal (campo principal).
- Trampa de foco para navegacion con `Tab` dentro del modal.
- Atributos ARIA (`role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-invalid`, `aria-describedby`).
- Mensajes inline por campo para fecha/hora/motivo.

## Control por rol (UI)
- Integracion con `DashboardUserContext` para leer `tipo_usuario` desde `/api/auth/me`.
- Politica aplicada en Citas:
  - escritura permitida: `ADMIN`, `ADMINISTRATIVO`.
  - lectura: `MEDICO`, `ESPECIALISTA`.
- Botones de `Programar`, `Reprogramar` y `Cancelar` quedan deshabilitados sin permisos y se muestra mensaje contextual.

## Notas
- Queda pendiente iteracion de accesibilidad avanzada (foco inicial, cierre con ESC, trampa de foco) y validaciones por campo mas detalladas.
