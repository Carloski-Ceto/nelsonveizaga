# Sesion: consolidacion multi-agente OpenCode

Fecha: 2026-05-31

## Objetivo
Adaptar la configuracion de agentes para que funcione correctamente en OpenCode y eliminar deriva de formato Cursor.

## Cambios
- `orchestrator` OpenCode actualizado con routing y permisos `task` para agentes reales del proyecto.
- Se agregan/ajustan subagentes OpenCode: `security`, `docs-memory`, `puds`, `diagrams-modeling`.
- Se agrega skill OpenCode: `.opencode/skills/uml-c4-puds-diagrams/SKILL.md`.
- Se actualizan `.opencode/README.md` y `.opencode/skills/README.md`.
- Se eliminan artefactos de `.cursor/*` para evitar doble fuente de verdad.

## Evidencia stack usada
- Backend Django/DRF: `backend/requirements/base.txt`, `backend/manage.py`.
- Frontend Next.js: `frontend/package.json`.
- Infra Docker Compose: `docker-compose.yml`.
- Sin mobile ni ai-inference dedicados en árbol actual.
