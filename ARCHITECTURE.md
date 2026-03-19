# ARCHITECTURE.md

Purpose:
- structural truth of the project

## System Overview
VetBlurbz currently ships as a Next.js App Router application with a local-first client workflow and optional signed-in persistence.

The implemented first slice centers on:
- reusable veterinary discharge-blurb sections grouped by collection
- a workspace that assembles multiple sections into one copied output
- adjacent support tools: handouts, scratchpad, shared blurbs, and quick calculations

## Major Components
- `Vs/src/app`
  - Next.js app shell and API routes
- `Vs/src/features/home`
  - first-slice UI composition and feature modules
- `Vs/src/lib/db.ts`
  - client-side Dexie persistence for local-first behavior
- `Vs/src/lib/prisma.ts`
  - Prisma client for server-side persistence
- `Vs/src/app/api/sections`
  - authenticated CRUD for server-backed sections
- `Vs/src/app/api/shared-sections`
  - read-only public shared blurbs feed
- `Vs/src/lib/auth.ts`
  - NextAuth credentials-based auth

## Boundaries And Responsibilities
- `HomePage.tsx`
  - top-level home orchestration, active tab state, search state, import/export actions
- `useCollection.ts`
  - merges local Dexie data with authenticated server data and handles sync fallback behavior
- `MainWithWorkspace.tsx`
  - lays out the primary content lane and right-side utility lane
- `SectionCard.tsx` and `RichEditor.tsx`
  - editing, preview, copy, public/starred toggles, and local title debounce behavior
- `SharedBlurbsManager.tsx`
  - combines local public blurbs with shared server blurbs for browsing
- `FastCalculations.tsx`
  - isolated calculation table surface kept separate from the main blurb workflow
- `db.ts`
  - per-user local isolation for sections, workspace, handouts, and scratchpad content
- `utils.ts`
  - clipboard formatting, import/export, search filtering, and plain-text conversion

## Data / Control Flow
1. The home page chooses an active collection/tab.
2. `useCollection` loads local sections from Dexie and, when authenticated, loads server sections through `/api/sections`.
3. If server data exists, local-only records are merged into the visible list and can sync upward.
4. Section content is edited as rich text and stored as sanitized HTML.
5. Users can push sections into the workspace, then copy assembled output as rich or plain text.
6. Shared blurbs are fetched from `/api/shared-sections` and combined with local public items.
7. Handouts and scratchpad remain client-local support tools scoped by browser user context.

## Current Structural Constraints
- Follow the shared multi-project operating model.
- Prioritize usability, clean interface, speed, and clarity.
- Keep local project truth in project docs, not in cross-project assumptions.
- Prefer clean workflow structure over premature complexity.
- Keep the first-lane workflow primary even while support tools exist.
- Avoid reintroducing single-file feature concentration like the original monolithic `src/app/page.tsx`.
