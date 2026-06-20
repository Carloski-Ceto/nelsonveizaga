# Sesion 2026-04-29 - Nuevos agentes architect-planner e infra

## Objetivo
Completar ecosistema multi-agente con cobertura explícita para planificación arquitectónica y operaciones de infraestructura.

## Cambios
- Creado `.agents/agents/architect-planner.md` en formato híbrido.
- Creado `.agents/agents/infra.md` en formato híbrido.
- Actualizado `.agents/agents/README.md` para registrar ambos agentes.

## Impacto
- `orchestrator` puede escalar tareas de diseño estructural a `architect-planner`.
- `orchestrator` puede escalar tareas Docker/env/deploy a `infra`.
- Mejor separación de responsabilidades y menor ambigüedad en tareas mixtas.

## Validación recomendada
- Ejecutar 1 caso de arquitectura (refactor multi-módulo) y 1 caso de infraestructura (ajuste compose/env) para comprobar calidad de enrutamiento.
