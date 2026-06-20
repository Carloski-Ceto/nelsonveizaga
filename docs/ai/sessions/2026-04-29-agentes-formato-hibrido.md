# Sesion 2026-04-29 - Agentes en formato hibrido

## Objetivo
Unificar prompts de agentes para compatibilidad tecnica (metadata parseable) y claridad operativa (instrucciones detalladas).

## Cambios aplicados
- Actualizados:
  - `.agents/agents/orchestrator.md`
  - `.agents/agents/backend.md`
  - `.agents/agents/frontend.md`
  - `.agents/agents/architecture.md`
  - `.agents/agents/code-review.md`
  - `.agents/agents/qa-testing.md`
- Cada archivo ahora incluye frontmatter con:
  - `name`, `description`, `model`, `tools`, `triggers`, `escalate_to`, `output_schema`.
- Se mantuvo cuerpo técnico previo (rol, alcance, reglas, entregables).
- Actualizado `.agents/agents/README.md` para declarar formato híbrido.

## Impacto
- Mejor interoperabilidad con runtimes de agentes.
- Mayor consistencia de salida entre especialistas.
- Menor ambiguedad al enrutar tareas por `orchestrator`.
