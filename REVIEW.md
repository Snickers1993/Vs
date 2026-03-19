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

## Phase 5: User Experience Analysis

### 5.1 Core Workflow UX

The primary workflow — create blurbs, organize by collection, search, assemble in workspace, copy — is coherent and low-friction. The tab-based navigation across collection types (exams, diseases, medications, etc.) maps well to how veterinarians think about discharge instructions.

**What works well:**
- **Search filtering** is immediate and spans both title and content. For a library of reusable text, this is the right interaction model.
- **Copy-to-clipboard** with both rich text and plain text options is a practical touch. Veterinary systems vary in what they accept.
- **Workspace assembly** (add sections → reorder → copy all) is the app's core value proposition and it works cleanly.
- **Starred sections** float to the top of lists, which accelerates repeat workflows.
- **Collapsible section cards** with a 24-line preview and gradient fade give a good balance between scannability and detail.

**What needs improvement:**

1. **Tab overload.** The home page presents 11 tabs: exams, diseases, medications, monitoring, recommendations, blurbs, discharge templates, handouts, fast calculations, shared blurbs, and starred. For a first-time user, the distinction between "blurbs," "discharge templates," and "recommendations" is not self-evident. The product docs acknowledge this risk — the home surface is broader than the first-slice story.

2. **No onboarding or empty states.** A new user sees empty collection tabs with no guidance on what to create first or how the workflow fits together. A brief inline prompt or example content would reduce time-to-value.

3. **Copy feedback is easy to miss.** The green flash on copy lasts 1.2 seconds. In a busy clinical workflow, a user may not notice it. A toast notification or a more persistent indicator would be more reliable.

4. **Workspace has no persistence indicator.** Items added to the workspace survive page refreshes (stored in Dexie) but there is no visual cue that the workspace is saved locally. Users may worry about losing assembled content.

5. **Import triggers a full page reload.** `importData()` calls `window.location.reload()` after writing to Dexie. This is jarring and loses any in-progress UI state. A state refresh via React would be smoother.

### 5.2 Editor Experience

The Tiptap-based `RichEditor` provides a clean WYSIWYG surface with essential formatting:
- Bold, Italic, Underline
- Bullet and numbered lists
- Line breaks, Undo, Redo

**Gaps:**
- **No heading support.** Discharge instructions often benefit from section headers (e.g., "Medications," "Follow-up"). The editor toolbar does not expose heading levels.
- **No link insertion UI.** The Link extension is loaded but there is no toolbar button to insert or edit links. Users would need to know keyboard shortcuts.
- **No image support.** Not critical for text blurbs, but some discharge workflows include diagrams.
- **No word/character count.** Some veterinary systems have paste-length limits. A count would help users stay within bounds.

### 5.3 Mobile Experience

The layout uses Tailwind responsive classes, but several concerns exist:
- **AuthButtons are hidden on mobile** (`hidden sm:flex`). Mobile users cannot sign in or out.
- **The 2-column section grid** collapses to 1 column on small screens, which is correct.
- **The workspace sidebar** is in the right column. On mobile, it likely stacks below the main content, making the assemble-and-copy workflow harder to use.
- **FastCalculations tables** are wide and may require horizontal scrolling on narrow screens.

### 5.4 Accessibility

No explicit accessibility audit has been done. Observable gaps:
- **No ARIA labels** on icon-only buttons (copy, star, delete, collapse).
- **No keyboard navigation** for the tab bar beyond default browser tab-key behavior.
- **Color-only feedback** for copy confirmation (green flash). Users with color vision differences may not perceive it.
- **No skip-to-content link** in the layout.
- **The rich text editor** relies on Tiptap's built-in accessibility, which is partial.

---

## Phase 6: Performance Analysis

### 6.1 Data Loading

- **Dexie queries** use `useLiveQuery` which subscribes to IndexedDB changes. This is efficient for local reads — only the affected collection is re-queried on change.
- **Server fetches** use SWR with automatic revalidation. The default SWR behavior (revalidate on focus, revalidate on reconnect) is appropriate for this use case.
- **No pagination.** All sections in a collection are loaded at once. For a personal blurb library this is likely fine (dozens to low hundreds of items), but would degrade with thousands.

### 6.2 Rendering

- **Section cards re-render on search.** Every keystroke in the search box triggers `filterSectionsBySearch()` across all sections, which calls `htmlToPlainText()` (DOM creation) for each section's content. For large collections, this could cause perceptible lag.
- **No virtualization.** All section cards are rendered in the DOM simultaneously. For 100+ sections, this means 100+ Tiptap editor instances if cards are expanded.
- **Workspace drag-and-drop** does not use a virtualized list, but workspace size is typically small (5-15 items), so this is not a concern.

### 6.3 Bundle Size

- **Tiptap** brings a significant bundle. The StarterKit alone includes ProseMirror core, which is ~100KB gzipped. This is acceptable for the app's purpose but worth noting.
- **DOMPurify** adds ~15KB gzipped.
- **Dexie** adds ~30KB gzipped.
- **No code splitting** beyond Next.js App Router's default page-level splitting. All home-page components load together. Given that the app is essentially a single-page tool, this is acceptable.

### 6.4 Network

- **SWR caching** prevents redundant fetches within the same session.
- **No request deduplication** for the auto-sync in `useCollection.ts`. Multiple render cycles can trigger multiple sync POSTs for the same local section.
- **Shared sections fetch** (`/api/shared-sections`) loads all public sections from all users. This will not scale if the user base grows. Pagination or filtering by relevance would be needed.

### 6.5 Performance Recommendations

1. **Debounce search input** at the component level (300-500ms) to prevent per-keystroke DOM parsing.
2. **Memoize `filterSectionsBySearch`** results with `useMemo` keyed on search term and section list.
3. **Guard auto-sync** with a ref to prevent redundant network requests.
4. **Add pagination** to `/api/shared-sections` before the shared blurb pool grows.
5. **Consider virtualization** (e.g., `@tanstack/react-virtual`) if collections regularly exceed 50 items.

---

## Phase 7: Testing & Reliability

### 7.1 Current Test Coverage

**There are zero automated tests.** No test runner, no test files, no test configuration. This is explicitly called out in STATUS.md and BACKLOG.md as a known gap.

### 7.2 What Should Be Tested

**Tier 1 — Critical path (unit/integration tests):**
- `useCollection` hook: add, update, delete, sync behavior, fallback to local
- `filterSectionsBySearch`: search matching correctness
- `sortSectionsByPriority`: ordering logic
- `sanitizeRichTextHtml`: XSS prevention
- `matchesUserScope`: user isolation
- `exportAllData` / `importData`: round-trip fidelity

**Tier 2 — API routes (integration tests):**
- `POST /api/sections`: creation, ownership, idempotency
- `PATCH /api/sections/[id]`: ownership check, partial updates
- `DELETE /api/sections/[id]`: ownership check, 404 handling
- `POST /api/register`: validation, duplicate handling, password hashing
- `GET /api/shared-sections`: public-only filtering

**Tier 3 — UI (component/E2E tests):**
- Section card: create, edit title, edit content, copy, star, delete
- Workspace: add sections, reorder, copy all, clear
- Tab navigation and search filtering
- Auth flow: sign up → sign in → see synced data

### 7.3 Recommended Test Stack

Given the project's stack (Next.js 16, React 19, App Router):
- **Vitest** for unit and integration tests (fast, ESM-native, React Testing Library compatible)
- **Playwright** for E2E tests (cross-browser, App Router support)
- **MSW (Mock Service Worker)** for API mocking in integration tests

### 7.4 Error Handling & Resilience

**Current state:**
- API routes return appropriate HTTP status codes (400, 401, 403, 404, 409, 503).
- Database unavailability returns 503 with empty arrays — graceful degradation.
- Client-side errors are caught and logged to console but not surfaced to the user.

**Gaps:**
- **No React error boundary.** A rendering error in any component will crash the entire app. An error boundary around the home page would allow graceful recovery.
- **No global error handler** for unhandled promise rejections (e.g., failed Dexie writes).
- **No retry logic** for failed server mutations. A network glitch during a section save silently loses the update.
- **No health check endpoint.** There is no `/api/health` to verify database connectivity, which would be useful for monitoring.

---

## Phase 8: Summary & Prioritized Recommendations

### 8.1 Overall Assessment

VetBlurbs is a well-structured, focused application that delivers on its core promise: fast, low-friction management of reusable veterinary discharge blurbs. The architecture is sound, the code is clean, and the modular refactoring has left the codebase in a maintainable state.

The project's strengths are:
- **Clear product focus.** The discharge-blurb workflow is coherent and practically useful.
- **Local-first resilience.** The app works without a server, which is the right default for a clinical tool.
- **Clean module boundaries.** Components are focused, lib modules are small, API routes are thin.
- **HTML sanitization.** DOMPurify is correctly applied to prevent XSS.
- **Graceful server degradation.** API failures return sensible defaults rather than crashing.

The project's weaknesses are:
- **Zero automated tests.** This is the single largest risk to ongoing development.
- **Sync layer fragility.** No conflict detection, no sync status, no guard against redundant sync.
- **Security gaps.** No rate limiting, debug logs in production, no input validation on content size.
- **Accessibility gaps.** No ARIA labels, no keyboard navigation, color-only feedback.

### 8.2 Prioritized Action Items

#### P0 — Do Before Any Feature Work

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | Add Vitest + write tests for `useCollection`, `utils`, `matchesUserScope` | Medium | Prevents regressions in the core data layer |
| 2 | Remove or gate `console.log` statements in API routes | Trivial | Stops PII leakage in production logs |
| 3 | Add input length validation to section POST/PATCH endpoints | Small | Prevents storage abuse |
| 4 | Add a React error boundary around `HomePage` | Small | Prevents full-app crashes from rendering errors |

#### P1 — Do During Phase 1 Polish

| # | Action | Effort | Impact |
|---|---|---|---|
| 5 | Guard auto-sync with a ref to prevent redundant requests | Small | Reduces unnecessary network traffic |
| 6 | Add sync status indicator (synced/syncing/error) | Medium | Users know if their data is safe |
| 7 | Debounce search input (300-500ms) | Small | Prevents per-keystroke DOM parsing |
| 8 | Fix `setTimeout` cleanup in `SectionCard.tsx` copy feedback | Trivial | Prevents potential memory leaks |
| 9 | Fix encoding issue in search placeholder text | Trivial | Visual polish |
| 10 | Remove unused `idb-keyval` dependency | Trivial | Reduces bundle size |
| 11 | Add ARIA labels to icon-only buttons | Small | Basic accessibility compliance |

#### P2 — Do Before Production / Public Launch

| # | Action | Effort | Impact |
|---|---|---|---|
| 12 | Add rate limiting to `/api/register` and sign-in | Medium | Prevents brute-force and enumeration attacks |
| 13 | Configure Content Security Policy headers | Medium | Defense-in-depth against XSS |
| 14 | Add soft deletes (`deletedAt` column) to Section model | Medium | Enables undo/recovery |
| 15 | Plan NextAuth v4 → v5 migration | Large | Moves off maintenance-mode auth library |
| 16 | Add Playwright E2E tests for core workflow | Medium | Validates the full user journey |
| 17 | Fix mobile auth (AuthButtons hidden on small screens) | Small | Mobile users can sign in |
| 18 | Add pagination to `/api/shared-sections` | Medium | Prevents scaling issues |

#### P3 — Nice To Have

| # | Action | Effort | Impact |
|---|---|---|---|
| 19 | Add heading support to rich text editor toolbar | Small | Better discharge instruction formatting |
| 20 | Add empty-state guidance for new users | Medium | Reduces time-to-value |
| 21 | Replace `window.location.reload()` in import with React state refresh | Medium | Smoother import UX |
| 22 | Add conflict detection to sync (version/timestamp comparison) | Large | Prevents silent data overwrites |
| 23 | Extract workspace sidebar from `MainWithWorkspace` | Medium | Cleaner component boundaries |
| 24 | Move hardcoded drug data from `FastCalculations.tsx` to a data file | Small | Cleaner separation of data and UI |

### 8.3 Closing Notes

The codebase is in good shape for its stage. The refactoring from monolithic to modular was well-executed, the dual-persistence model is architecturally sound, and the product focus is clear. The most impactful next step is adding automated test coverage — it will unlock confident iteration on everything else.

The security issues (rate limiting, input validation, debug logs) are not emergencies in a pre-launch context but should be resolved before any public-facing deployment.

The UX is functional and practical. The main opportunities are reducing tab clutter (as the product docs already recognize) and adding basic accessibility support.

---

*Review complete. 8 phases, 24 action items, zero tests to show for it — but a solid foundation to build on.*
