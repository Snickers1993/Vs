# AGENTS.md

Purpose:
- project-local agent operating rules
- required read order
- implementation guardrails
- doc update discipline
- escalation rules

## Default Read Order
1. `CONTEXT_BOOTSTRAP.md`
2. `STATUS.md`
3. `NOW.md`
4. `HANDOFF.md`
5. `AGENTS.md`

Read deeper docs only when needed:
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN.md`
- `RISKS.md`
- `BACKLOG.md`
- `ROADMAP.md`

## Status Protocol
- `SEEN`
- `PLAN`
- `WORKING`
- `BLOCKED`
- `CHECKPOINT`
- `DONE`

## Roles
- Nick = human lead / owner / decision-maker
- Gal = cross-project supervisor, architect, workflow governor, personal assistant
- Leo = primary VetBlurbz implementation / coding agent

## Worker reset truth
- Leo is the active VetBlurbz worker
- Leo should treat old Obsidian ownership/history as obsolete default context
- project truth should come from the current VetBlurbz docs, not stale cross-project memory

## Core Rules
- Stay inside one project at a time unless Nick explicitly sequences otherwise.
- Important project truth must not remain only in chat.
- Deferred work goes to `BACKLOG.md`.
- Durable decisions go to `DECISIONS.md`.
- Update the smallest correct set of docs for the change that actually happened.
- Do not treat backlog as approval to implement.
- Do not assume facts from other projects without explicit local adoption.
- `WORKING` is intent, not proof.
- For harder tasks, a meaningful checkpoint should normally appear at least every 24 minutes.
