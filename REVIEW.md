# REVIEW.md — VetBlurbs Comprehensive Code Review

Purpose: Full independent review of the VetBlurbs codebase covering architecture, code quality, security, data integrity, UX, performance, testing, and actionable recommendations.

Reviewer: Claude (automated code review agent)
Date: 2026-03-19
Codebase: ~2,350 lines across 31 source files

---

## Phase 1: Architecture & Project Structure

### 1.1 Overall Architecture Assessment

VetBlurbs is a Next.js 16 App Router application with a local-first client workflow and optional authenticated server persistence. The architecture is well-suited to its purpose: a veterinary discharge-blurb authoring tool that must work fast and offline.

**Architecture diagram:**

```
Browser (Dexie/IndexedDB)
    ↕ local-first reads/writes
React UI (features/home)
    ↕ SWR + fetch (when authenticated)
Next.js API Routes (/api/sections, /api/shared-sections, /api/register)
    ↕ Prisma ORM
PostgreSQL
```

**Verdict: Sound.** The dual-persistence model (Dexie locally, Prisma/Postgres on the server) is a reasonable choice for a tool that prioritizes speed and offline resilience. The risk is in the sync layer, which is addressed in Phase 4.

### 1.2 Project Layout

```
src/
  app/                    # Next.js App Router shell, API routes, auth pages
  features/home/          # First-slice feature modules (HomePage, useCollection, components)
  components/             # Shared UI (AuthButtons, Providers)
  lib/                    # Shared utilities (db, auth, prisma, html, session, user-scope, sections)
prisma/                   # Schema and migrations
```

**Strengths:**
- The refactoring from a monolithic `page.tsx` into `src/features/home` was the right call. Each component has a clear responsibility.
- Lib modules are small and focused (e.g., `html.ts` is 11 lines, `user-scope.ts` is 7 lines). No unnecessary abstraction.
- API routes follow REST conventions and are thin wrappers around Prisma queries.

**Concerns:**
- `src/components/` only has 2 files (`AuthButtons.tsx`, `Providers.tsx`). These could live in `src/app/` or `src/features/home/` to reduce directory sprawl, but this is minor.
- There is no `src/features/` convention beyond `home`. If future features arrive, the pattern is set but untested at scale.

### 1.3 Dependency Assessment

| Dependency | Version | Purpose | Risk |
|---|---|---|---|
| next | ^16.1.7 | Framework | Low — current |
| react | 19.1.0 | UI | Low — current |
| next-auth | ^4.24.12 | Auth | Medium — v4 is maintenance mode; v5 is the active line |
| @prisma/client | ^6.13.0 | ORM | Low |
| dexie | ^4.0.11 | IndexedDB | Low |
| @tiptap/react | ^3.0.9 | Rich editor | Low |
| bcrypt | ^6.0.0 | Password hashing | Low |
| dompurify | ^3.3.0 | HTML sanitization | Low |
| swr | ^2.3.4 | Data fetching | Low |
| idb-keyval | ^6.2.2 | Key-value store | Low — appears unused in source |

**Notable:** `idb-keyval` is listed as a dependency but no import of it was found in the source code. This is dead weight and should be removed.

### 1.4 Build & Tooling

- **Build pipeline:** `prisma generate && next build` — correct ordering.
- **Lint:** ESLint 9 with `eslint-config-next` — standard Next.js setup.
- **TypeScript:** Strict mode not explicitly confirmed but TSC passes cleanly.
- **No test runner configured.** No `jest`, `vitest`, or `playwright` in dependencies. This is the single largest tooling gap.

---

## Phase 2: Code Quality & Patterns

### 2.1 TypeScript Usage

TypeScript is used throughout. Types are defined in `src/features/home/types.ts`:

```typescript
type TabKey = CollectionKey | "fastCalculations" | "sharedBlurbs" | "monitoring" | "starred"
type Section = { id, title, content, isPublic?, isStarred?, updatedAt?, createdAt? }
type CalcRow = { name, conc, concUnit, dosePerKg, unit }
```

**Issues:**
- **Fragile type casting** in `useCollection.ts`: patterns like `as unknown as { id?: string }` bypass type safety. This should use proper type narrowing or validation.
- **Magic strings for collection names** appear in multiple files (`"exams"`, `"medications"`, `"dischargeTemplates"`, etc.) rather than being derived from a single source of truth. The `CollectionKey` type exists but the string literals are repeated in tab definitions, Dexie queries, and API calls.
- **`Section` type vs `SectionDto`**: the client-side `Section` type and the server-side `SectionDto` (from `lib/sections.ts`) are similar but not formally linked. Changes to one could silently break the other.

### 2.2 Component Patterns

**Well-executed patterns:**
- `SectionCard.tsx` uses a 500ms debounced title save — prevents excessive writes without sacrificing responsiveness.
- `RichEditor.tsx` wraps Tiptap cleanly with a focused toolbar (Bold, Italic, Underline, Lists, Undo/Redo).
- `Scratchpad.tsx` reuses the same editor with per-user Dexie persistence.
- `FastCalculations.tsx` isolates the drug calculator from the main blurb workflow, which is correct given the different data model.

**Patterns that need attention:**
- `MainWithWorkspace.tsx` (228 lines) is the largest component and handles layout orchestration, workspace logic, scratchpad toggling, and handout display. It could benefit from extracting the workspace sidebar into its own component.
- `HomePage.tsx` passes many props through to `MainWithWorkspace`, which passes subsets onward. This prop-drilling is manageable at current scale but will become friction if features grow.
- Copy feedback uses a 1.2-second timeout in `SectionCard.tsx`. This is handled with raw `setTimeout` — no cleanup on unmount, which can cause React state-update-on-unmounted-component warnings.

### 2.3 Hook Quality

**`useCollection.ts` (158 lines)** is the most complex hook and the heart of the data layer:
- Merges local Dexie sections with server sections via SWR.
- Provides `add`, `updateTitle`, `updateContent`, `updatePublic`, `updateStarred`, `removeById`, and `syncLocalToServer` methods.
- Falls back to local-only mode when the server is unavailable.

**Issues in `useCollection.ts`:**
1. **Auto-sync on every render:** `syncLocalToServer()` is called during rendering logic without a guard against repeated execution. This can cause redundant network requests on every re-render.
2. **No optimistic updates:** Server mutations wait for the response before updating the UI. For a usability-first app, optimistic updates through SWR's `mutate` would improve perceived speed.
3. **Error swallowing:** Several catch blocks log errors but don't surface them to the user. A failed save looks identical to a successful one from the user's perspective.

### 2.4 Utility Functions (`utils.ts`, 132 lines)

- `htmlToPlainText()`: Creates a temporary DOM element to strip HTML. Correct approach but only works in browser context (will throw in SSR).
- `escapeHtml()`: Manual character replacement for `&`, `<`, `>`, `"`, `'`. Standard and correct.
- `sortSectionsByPriority()`: Starred items first, then by `updatedAt` descending. Clean logic.
- `filterSectionsBySearch()`: Case-insensitive search across title and content. No debounce at this level (the caller should debounce).
- `exportAllData()` / `importData()`: JSON export with version 1.1 format. Import regenerates IDs and sanitizes HTML — good defensive practice. However, import calls `window.location.reload()` which is a blunt instrument.

### 2.5 Code Smells

| Smell | Location | Severity |
|---|---|---|
| `console.log` debug statements in API routes | `api/sections/route.ts` | Medium — leaks auth info in production |
| `as unknown as` type casting | `useCollection.ts` | Medium — bypasses type safety |
| `setTimeout` without cleanup | `SectionCard.tsx` | Low — potential memory leak |
| Hardcoded drug data in component | `FastCalculations.tsx` | Low — should be a data file |
| `window.location.reload()` after import | `utils.ts` | Low — poor UX |
| Encoding issue in placeholder text | Search input placeholder | Low — displays `â€¦` instead of `…` |

---

## Phase 3: Security Analysis

### 3.1 Authentication

**Setup:** NextAuth v4 with credentials provider, JWT sessions, bcrypt password hashing (10 rounds).

**Strengths:**
- Passwords are hashed with bcrypt before storage.
- Email is lowercased before lookup, preventing case-sensitivity bypass.
- JWT strategy avoids server-side session storage overhead.
- Auth pages are custom (`/auth/signin`, `/auth/signup`), not default NextAuth pages.

**Vulnerabilities:**

1. **No rate limiting on `/api/register`.**
   An attacker can enumerate existing emails (409 response) or flood the registration endpoint. This is the highest-priority security issue.

2. **No rate limiting on sign-in.**
   Brute-force password attacks are not throttled. NextAuth v4 does not provide built-in rate limiting.

3. **Debug logging exposes user emails.**
   `api/sections/route.ts` logs `session.user?.email` on every GET request. In production, this writes PII to server logs.

4. **No input length validation on section content.**
   A malicious user could POST arbitrarily large content to `/api/sections`, consuming database storage and memory.

5. **No CSRF token validation on custom API routes.**
   NextAuth protects its own routes, but `/api/sections` and `/api/register` rely only on session cookies. In a same-site cookie configuration this is partially mitigated, but explicit CSRF protection is better.

### 3.2 Data Sanitization

**Strengths:**
- DOMPurify is used to sanitize rich-text HTML before storage (`lib/html.ts`).
- `escapeHtml()` is available for display contexts.
- Import data is sanitized before being written to Dexie.

**Gaps:**
- Sanitization happens at the storage layer but not at the API response layer. If a section's content were corrupted in the database, it would be served unsanitized.
- No Content Security Policy (CSP) headers are configured in `next.config.ts`.

### 3.3 Authorization

**Strengths:**
- API routes check `session.user` before allowing mutations.
- Section PATCH/DELETE verifies `section.userId === userId` (ownership check).
- `matchesUserScope()` enforces per-user isolation in Dexie queries.
- Shared sections endpoint is intentionally public and read-only.

**Gaps:**
- No role-based access control. All authenticated users have identical permissions. This is fine for current scope but would need attention if admin features are added.
- The `isPublic` flag on sections is user-controlled. A user can mark any section as public, and it immediately appears in the shared feed. There is no moderation layer.

### 3.4 Dependency Security

- `npm audit` is reported clean as of the last status update.
- `bcrypt` v6 is current and uses native bindings.
- `next-auth` v4 is in maintenance mode. Known vulnerabilities in v4 are patched, but the active development line is v5 (Auth.js). Migration should be planned.

### 3.5 Security Recommendations (Priority Order)

1. **Add rate limiting** to `/api/register` and NextAuth sign-in (use `next-rate-limit` or middleware-based approach).
2. **Remove `console.log` statements** from production API routes or gate them behind `NODE_ENV === 'development'`.
3. **Add input length validation** to POST/PATCH section endpoints (e.g., title max 500 chars, content max 100KB).
4. **Configure CSP headers** in `next.config.ts`.
5. **Plan NextAuth v4 → v5 migration** before v4 reaches end-of-life.

---

## Phase 4: Data Integrity & Persistence

### 4.1 Dual-Persistence Model

The app uses two persistence layers:
- **Dexie (IndexedDB):** Local-first storage for sections, workspace items, handouts, and scratchpad. Works offline.
- **Prisma (PostgreSQL):** Server-backed storage for sections only. Requires authentication.

This is the app's most architecturally interesting decision and also its biggest source of complexity.

### 4.2 Sync Behavior (`useCollection.ts`)

**How sync works:**
1. On load, Dexie sections are read for the active collection.
2. If the user is authenticated, server sections are fetched via SWR.
3. If server data exists, it becomes the primary source. Local-only sections (those without a matching server ID) are merged into the visible list.
4. `syncLocalToServer()` attempts to push local-only sections to the server.

**Issues:**

1. **Last-write-wins with no conflict detection.**
   If a user edits a section locally while offline, then the server version is updated by another client, the sync will silently overwrite whichever version is older. There is no conflict detection, merging, or user notification.

2. **Auto-sync runs on every render cycle.**
   The sync logic in `useCollection.ts` is triggered during rendering without a ref-based guard or effect dependency. This means a component re-render (from any cause) can trigger a redundant sync attempt.

3. **No sync status indicator.**
   The user has no visibility into whether their data has been synced to the server. A section could fail to sync, and the user would not know unless they checked the browser console.

4. **Dexie data is ephemeral.**
   IndexedDB can be cleared by the browser (storage pressure, user action, incognito mode). There is no warning about this. Users who rely on local-only mode without export could lose data.

5. **Import replaces all data.**
   `importData()` in `utils.ts` does a bulk put into Dexie, but it regenerates IDs. This means imported sections will not match existing server sections, potentially creating duplicates after sync.

### 4.3 Database Schema

The Prisma schema is clean and appropriate:
- `Section` has proper indexes on `[userId, collection]`, `isPublic`, and `isStarred`.
- Cascading deletes from `User` to `Section`, `Account`, and `Session` are correct for this app's data model.
- No soft-delete mechanism. Deleted sections are permanently removed.

**Recommendations:**
- Add a `deletedAt` column for soft deletes, especially given the lack of backup/undo.
- Consider adding a `version` or `updatedAt` comparison for conflict detection during sync.
- Add a `contentLength` or similar constraint at the database level to prevent unbounded storage.

### 4.4 Workspace & Supporting Data

- **Workspace items** are stored in Dexie only. They are transient by design (assemble sections, copy, clear). This is the correct persistence choice.
- **Handouts** store file data as blobs in Dexie. This works for small files but IndexedDB has storage limits. Large or numerous handouts could hit browser quotas without warning.
- **Scratchpad** content is stored as HTML in Dexie, scoped by user email. This is appropriate for a personal notepad feature.

---

*End of Part 1 (Phases 1-4). Part 2 (Phases 5-8) covers UX, Performance, Testing, and Recommendations.*
