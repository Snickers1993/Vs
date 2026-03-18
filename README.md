# VetBlurbs

VetBlurbs is a usability-first veterinary workflow app focused on reusable discharge blurbs.

The current first slice lets a user:
- create and organize reusable blurbs by collection
- search and edit blurbs quickly
- assemble multiple blurbs into a workspace
- copy the combined result as rich text or plain text
- use sidecar tools such as handouts, scratchpad, shared blurbs, and quick calculations

## Stack

- Next.js 16 App Router
- React 19
- Prisma for server-backed persistence
- NextAuth credentials auth
- Dexie for local-first browser persistence
- Tailwind CSS 4

## Project Structure

- `src/app`
  - app shell and API routes
- `src/features/home`
  - home page feature modules
- `src/lib`
  - auth, Prisma, Dexie, and shared utilities
- `prisma`
  - schema and migrations

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Run checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Apply database migrations when using a configured server-backed database:

```bash
npm run db:migrate
```

## Environment

Server-backed auth and section persistence require:

```bash
DATABASE_URL=...
NEXTAUTH_SECRET=...
```

Without those, the local-first client workflow is still the main architectural direction, but authenticated server features will not function.

## Current Notes

- The home experience was refactored out of a single large `src/app/page.tsx` file into `src/features/home`.
- The repo has already been hardened for fail-closed auth behavior and removal of exposed diagnostic routes.
- `npm audit` is currently clean on the supported dependency set.
