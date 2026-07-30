# Frontend — AGENTS.md

Vite + React SPA for Clockwise (shadcn/ui, Tailwind v4). Repo-wide overview,
architecture, directory map, and dev/test commands live in the root
**`AGENTS.md`** (auto-loaded on every session via ancestor walk-up).

## Where the rules live

Conventions are **modular and shared** with the backend, in `../.omp/rules/`.
They are already inlined by the root `AGENTS.md`, so they load automatically —
this file intentionally does **not** re-`@import` them (that would duplicate the
content). Read the **frontend** sections:

- `../.omp/rules/coding-conventions.md` → **Tooling & Imports**, **Frontend Patterns**
- `../.omp/rules/testing.md` → **Frontend — Vitest**
- `../.omp/rules/security.md` → **Tokens (frontend)**

## Frontend-specific notes

Home for guidance that applies to `frontend/` only and is not in the shared
rules. Orientation cheat-sheet:

- **Data flow:** API fn (`*-api.ts`, wraps `apiClient`) → React Query hook
  (`use-*.ts`) → component. Server state = TanStack Query; auth = React Context;
  UI state = `useState`.
- **Forms:** `react-hook-form` + `zod`; avoid `z.coerce.number()` and
  `type="number"` (see shared **Frontend Patterns** for the why).
- **HTTP:** `apiClient<T>()` (`lib/api-client.ts`) auto-refreshes on 401; token
  is in-memory only (see **Tokens (frontend)**).
- Commands run inside `frontend/` — see root `AGENTS.md` → **Development
  Commands**.
