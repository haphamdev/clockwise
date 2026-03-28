# Frontend — CLAUDE.md

## Commands

```bash
pnpm install                    # Install dependencies
pnpm dev                        # Vite dev server (port 5173)
pnpm build                      # TypeScript check + Vite production build
pnpm lint                       # ESLint
pnpm test                       # Jest (hooks, utils, services — no .tsx)
pnpm test:e2e                   # Playwright (UI/E2E tests)
```

## Architecture

- **Entry:** `src/main.tsx` → `src/App.tsx` (React Router)
- **Routes:** `/login`, `/dashboard`, `/time-logs`, `/projects`, `/reports`, `/admin`
- **UI:** shadcn/ui components (configured in `components.json`), Tailwind CSS
- **Path aliases:** `@/` → `src/`, `@/components`, `@/ui`, `@/lib`, `@/hooks`
- **API proxy:** Vite dev server proxies `/api` → `http://localhost:3000`

## File Organization

Keep files small and single-purpose — aim for ~100 lines, hard max 300 lines. Split code by responsibility:

- **API client functions** (`lib/<domain>/<domain>-api.ts`) — plain async functions, no React
- **Query keys** (`lib/<domain>/<domain>-keys.ts`) — query key factories
- **Hooks** (`lib/<domain>/use-<name>.ts`) — one hook per file, wraps useQuery/useMutation
- **Types** (`lib/<domain>/types.ts`) — shared interfaces/types for a domain
- **UI components** — one component per file, no data-fetching logic

## Conventions

- No barrel imports — do not create `index.ts` re-export files. Always import directly from the source file.
