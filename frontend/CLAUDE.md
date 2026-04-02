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
- Always drill the user for clarification questions before making a plan for non-trivial changes.

## Gotchas

- **shadcn `FormItem`/`FormLabel` require `FormField`, not `Controller`** — shadcn/ui form components (`FormItem`, `FormLabel`, `FormControl`, `FormMessage`) need `FormFieldContext` provided only by shadcn's `FormField`. When using react-hook-form's `Controller` directly (e.g., for `Combobox` or `TaskAutocomplete`), use plain `<div className="space-y-2">` + `<Label>` instead. See `src/components/time-logs/log-time-sheet.tsx`.
- **`z.coerce.number()` breaks react-hook-form** — Creates input type `unknown` incompatible with `zodResolver`'s `Resolver` type inference. Use `z.string()` with `.refine()` validators and `parseFloat()` on submit. See `src/components/time-logs/log-time-sheet.tsx` hours field.
- **`type="number"` has locale issues** — Browser forces comma/dot decimal separator based on OS locale; `lang="en"` doesn't reliably fix it. Use `type="text"` with `inputMode="decimal"`, regex-filter input to digits/dots, auto-convert commas to dots. See `src/components/time-logs/log-time-sheet.tsx` hours field.
- **react-hook-form `reValidateMode`** — Default `reValidateMode: 'onChange'` causes instant validation errors while typing intermediate values (e.g., typing `0.25` triggers error at `0`). Use `mode: 'onSubmit'` + `reValidateMode: 'onBlur'` for better UX. See `src/components/time-logs/log-time-sheet.tsx`.
