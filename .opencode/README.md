# OpenCode Multi-Agent System

This project uses OpenCode official project-level layout:

- Agents: `.opencode/agents/`
- Skills: `.opencode/skills/`

Important:
- Do not create `README.md` inside `.opencode/agents/`.
- Every `.md` file in `.opencode/agents/` is treated as an agent.

## Detected Stack (Evidence-Based)

- Backend: Django + DRF (`backend/manage.py`, `backend/requirements/base.txt` with `Django` and `djangorestframework`)
- Frontend: Next.js App Router + React (`frontend/package.json` with `next`, `react`; `frontend/next.config.js`)
- Database: PostgreSQL (`docker-compose.yml` service `db` with `postgres:16-alpine`)
- Containers: Docker Compose (`docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`)
- Email dev sandbox: Mailhog (`docker-compose.yml` service `mailhog`)
- Mobile: not detected with evidence sufficient.

## Agents

- `orchestrator` (primary): reads context, detects stack, routes tasks, invokes skills, consolidates final output.
- `backend`: Django/DRF/API/data/security implementation specialist.
- `frontend`: Next.js/React/web UX integration specialist.
- `ui-ux`: usability, accessibility, responsive and interaction-quality specialist.
- `architecture`: boundaries, modularity, contracts, and technical decisions.
- `architect-planner`: phased planning for large/ambiguous tasks.
- `code-review`: read-only risk and quality review.
- `qa-testing`: validation strategy, tests, lint/build/regression checks.
- `devops`: Docker/Compose/env/deploy/runtime operations specialist.
- `security`: JWT/RBAC/CORS/secrets/hardening specialist.
- `docs-memory`: updates continuity docs in `docs/ai`.
- `puds`: process artifacts and traceability specialist.
- `diagrams-modeling`: UML/C4/PlantUML/draw.io/EA modeling specialist.

Not created (no evidence currently):
- `mobile`
- `ai-inference`
- `ai-researcher`

## Orchestration Flow

1. `orchestrator` reads context (`agents.md`, `docs/ai/*`, `README`, config files).
2. It classifies the task by intent and impact area.
3. It delegates to one or more subagents.
4. It merges outputs into one final response with plan, files, validation, risks, and next steps.

## Skills

- Project-local skills under `.opencode/skills/`: see `.opencode/skills/README.md`.
- Diagram/modeling skill available: `.opencode/skills/uml-c4-puds-diagrams/SKILL.md`.
- If a needed capability is missing, use `find-skills` to discover reusable skills.

## Validation Commands

- `opencode debug config` (if OpenCode CLI is installed)
- Verify `.opencode/agents/` contains only agent files (no README).
- Verify `orchestrator` uses `mode: primary`.
- Verify other agents use `mode: subagent`.
