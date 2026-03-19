# DECISIONS.md

Purpose:
- durable decisions that changed how the project is built or constrained

## Status Key
- Locked
- Provisional

## Decisions

### Decision 001: VetBlurbz Uses The Standard Multi-Project Document Scaffold
- Status: Locked
- Decision: VetBlurbz will use the standard document set: `AGENTS.md`, `ARCHITECTURE.md`, `BACKLOG.md`, `CONTEXT_BOOTSTRAP.md`, `DECISIONS.md`, `DESIGN.md`, `HANDOFF.md`, `HEARTBEAT.md`, `NOW.md`, `RISKS.md`, `ROADMAP.md`, `STATUS.md`.
- Why: this keeps project structure consistent across the portfolio and reduces agent onboarding friction.

### Decision 002: VetBlurbz Prioritizes Usability And Clean Interface
- Status: Locked
- Decision: VetBlurbz should prioritize usability, clean interface, speed, legibility, and efficient filtering/workflow support.
- Why: the project is intended to demonstrate practical product design value for veterinary software rather than backend/compliance depth.

### Decision 003: Project Truth Must Live In Project-Local Docs
- Status: Locked
- Decision: project-local truth for VetBlurbz must be recorded in VetBlurbz docs rather than assumed from Obsidian, Project Diablo, VetHackz, or chat memory.
- Why: this prevents context bleed and makes the project safe for agent handoff.

### Decision 004: The First Product Slice Is A Discharge-Blurb Library And Assembly Workspace
- Status: Locked
- Decision: the first concrete VetBlurbz workflow slice is reusable discharge-blurb authoring, organization, retrieval, assembly, and copy output.
- Why: this already exists in the implementation, fits the project's usability-first goals, and is a credible product showcase lane for veterinary workflow design.

### Decision 005: VetBlurbz Uses A Local-First Workflow With Optional Authenticated Server Persistence
- Status: Locked
- Decision: core content creation and supporting tools should remain usable locally through Dexie even when the authenticated server path is unavailable.
- Why: this preserves speed, resilience, and low-friction workflow while still allowing account-backed persistence when configured.

### Decision 006: Home-Slice Features Should Be Modularized Under `src/features/home`
- Status: Locked
- Decision: the home experience should be composed from focused feature modules instead of concentrating most behavior in `src/app/page.tsx`.
- Why: the original single-file approach became difficult to reason about, harder to review, and slower to evolve safely.
