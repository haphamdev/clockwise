# Backend — AGENTS.md

NestJS REST API for Clockwise. Repo-wide overview, architecture, directory map,
and dev/test commands live in the root **`AGENTS.md`** (auto-loaded on every
session via ancestor walk-up).

## Where the rules live

Conventions are **modular and shared** with the frontend, in `../.omp/rules/`.
They are already inlined by the root `AGENTS.md`, so they load automatically —
this file intentionally does **not** re-`@import` them (that would duplicate the
content). Read the **backend** sections:

- `../.omp/rules/coding-conventions.md` → **Tooling & Imports**, **Backend Patterns**
- `../.omp/rules/testing.md` → **Backend — Jest**, **Manual & Import Testing**
- `../.omp/rules/security.md` → **Authorization (backend)**, **Secrets & Environment (backend / ops)**, **Data Integrity & Audit Trail (backend)**

## Backend-specific notes

Home for guidance that applies to `backend/` only and is not in the shared
rules. Orientation cheat-sheet:

- **Layering:** `Controller → Service → Repository → Prisma`. Only the
  repository imports `@prisma/client`; entities are Prisma-free TS interfaces.
- **Errors:** services throw `AppException(ErrorCode.<NS>.<CODE>, message,
  HttpStatus)`; repositories convert Prisma `P2002` to domain exceptions.
- **Schema is source of truth:** `prisma/schema.prisma`; run `pnpm
  prisma:generate` after edits. Integration tests need Docker (Testcontainers).
- Commands run inside `backend/` — see root `AGENTS.md` → **Development
  Commands**.
