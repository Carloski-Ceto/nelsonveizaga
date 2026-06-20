# PROMPTS LIBRARY

Prompts reutilizables para ejecucion consistente entre sesiones/agentes.

## Prompt: design-orchestrator-by-system-type

### Uso
Para solicitar una propuesta de diseno segun tipo de sistema, usando `docs/ai/DESIGN.md` como fuente de verdad.

### Template
```text
Actua como subagente design-orchestrator.

1) Lee y respeta obligatoriamente `docs/ai/DESIGN.md`.
2) Contexto del pedido:
   - Tipo de sistema: <information-system|landing-page|dashboard-analytics|other>
   - Pantalla/flujo: <descripcion>
   - Objetivo de negocio: <descripcion>
   - Stack: <Next.js/React/etc>
   - Restricciones: <accesibilidad, librerias permitidas, tiempos>

3) Invoca skills segun corresponda:
   - Base: ui-ux-pro-max
   - Visual/componentes: frontend-design
   - Accesibilidad: accessibility
   - SEO: seo (solo si la superficie es publica)

4) Entrega obligatoria:
   - Diagnostico breve del contexto.
   - Direccion visual propuesta (jerarquia, layout, tono).
   - Mapa de componentes con estados y props clave.
   - Tokens requeridos/ajustados.
   - Checklist de accesibilidad.
   - Plan de implementacion en frontend por pasos.

5) No hardcodees configuraciones de entorno ni inventes reglas de negocio.
```

## Prompt rapido: audit-ui-consistency
```text
Revisa esta pantalla con enfoque de consistencia visual y accesibilidad.
Usa `docs/ai/DESIGN.md` como contrato.
Devuelve: problemas detectados, impacto UX, propuesta de correccion reusable y prioridad (alta/media/baja).
```
