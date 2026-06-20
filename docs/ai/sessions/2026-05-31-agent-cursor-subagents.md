# Sesion: configuracion Cursor multi-agente

Fecha: 2026-05-31

## Objetivo
Crear sistema multi-agente en formato oficial Cursor para este repo, adaptado al stack real detectado.

## Evidencia base usada
- `README.md`: Django + DRF, Next.js 14, PostgreSQL, Docker Compose.
- `backend/requirements/base.txt`: dependencias Django/DRF/JWT.
- `frontend/package.json`: Next.js/React/Playwright.
- `docker-compose.yml`: servicios `db`, `backend`, `frontend`, `mailhog`.
- `docs/ai/ARCHITECTURE.md`, `TECH_STACK.md`, `CURRENT_STATE.md`.

## Cambios realizados
- Creada carpeta `.cursor/agents/` con:
  - `orchestrator.md`
  - `backend.md`
  - `frontend.md`
  - `infra.md`
  - `architect-planner.md`
  - `reviewer.md`
  - `qa-testing.md`
  - `security.md`
  - `docs-memory.md`
  - `puds.md`
  - `diagrams-modeling.md`
- Creada skill `.cursor/skills/uml-c4-puds-diagrams/SKILL.md` y `.cursor/skills/README.md`.
- Creado `.cursor/mcp.json` (drawio) y `.cursor/mcp.example.json` (drawio + Enterprise Architect ejemplo).

## Decisiones
- No crear `mobile`, `ai-inference`, `ai-researcher` por falta de evidencia en el repo.
- Mantener OpenCode en paralelo sin mezclar formatos en `.cursor/agents/`.

## Validacion rapida
- `.cursor/agents/` contiene solo agentes (sin README interno).
- Frontmatter YAML presente en todos los agentes Cursor.
- `orchestrator` incluye routing y reglas de skills/memoria.
