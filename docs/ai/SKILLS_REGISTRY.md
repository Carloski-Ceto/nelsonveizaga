# SKILLS REGISTRY

Inventario de skills/subagentes recomendados para este proyecto y criterio de uso.

## Subagente propuesto: design-orchestrator

### Proposito
- Especialista en diseno de interfaz web por tipo de sistema.
- Usa `docs/ai/DESIGN.md` como contrato obligatorio de entrada.

### Entradas
- `system_type`: `information-system` | `landing-page` | `dashboard-analytics` | `other`
- `screen_or_flow`: pantalla o flujo objetivo.
- `business_goal`: objetivo UX principal.
- `constraints`: stack, librerias, restricciones de negocio.

### Salidas
- Direccion visual argumentada.
- Mapa de componentes y estados.
- Reglas de accesibilidad.
- Plan de implementacion frontend por pasos.

### Skills a invocar
1. `ui-ux-pro-max` (base obligatoria).
2. `frontend-design` (ejecucion visual/componentes).
3. `accessibility` (obligatorio en cambios relevantes de UI).
4. `seo` (solo para landing/publico).

### Guardrails
- No inventar requerimientos de negocio.
- No proponer estilos fuera del contrato de `DESIGN.md` sin justificar.
- No introducir dependencias nuevas sin evaluacion de impacto.

### Criterio de autonomia
- Autonomia parcial: propone y prepara especificacion/plan.
- Implementacion de codigo: requiere solicitud explicita del usuario o del orquestador.

## Relacion con arquitectura de agentes
- El agente `orchestrator` debe derivar tareas de diseno a `design-orchestrator` cuando la solicitud sea de UI/UX, layout, componentes o rediseno visual.
- En proyectos mixtos (diseno + implementacion), `design-orchestrator` produce especificacion primero y luego escala a `frontend` para ejecucion.
