# Agents Registry

Available custom agents under `.agents/agents/`:

- `orchestrator.md` — main router and coordinator.
- `backend.md` — Django/DRF/PostgreSQL/auth/business logic.
- `frontend.md` — Next.js/React/UI/API consumption.
- `architecture.md` — modular design and system decisions.
- `architect-planner.md` — architecture planning and phased execution strategy.
- `code-review.md` — quality gate and risk assessment.
- `qa-testing.md` — test planning and verification.
- `infra.md` — Docker/env/deploy operations and infrastructure guardrails.

All agent files follow hybrid format:
- machine-readable frontmatter (`name`, `description`, `tools`, `triggers`, `output_schema`)
- human-readable operational body (role, scope, rules, deliverables)

## Intended Flow
1. `orchestrator` classifies request.
2. `orchestrator` delegates to one or more specialists.
3. Specialists return scoped output.
4. `orchestrator` consolidates and responds.

## Notes
- Prompt rules must remain aligned with `agents.md` and `docs/ai/*`.
- Skills can be invoked by `orchestrator` when request matches capability.
