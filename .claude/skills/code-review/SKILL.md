---
name: code-review
description: >
  Perform thorough, actionable code reviews for a fullstack application with a React frontend and NestJS backend.
  Use this skill whenever the user asks to review, audit, critique, check, or give feedback on any code — even casually
  ("take a look at this", "what do you think of this file?", "any issues here?"). Trigger for any React component,
  hook, service, module, controller, DTO, entity, guard, pipe, or config file. Also trigger for PR descriptions,
  diffs, or paste of multiple files. Do NOT skip this skill just because the snippet is short — even small files
  warrant structured review.
---

# Code Review Skill — React + NestJS Fullstack

## Arguments

This skill accepts an optional argument: `/code-review <target>`

The `<target>` tells you what to review. Interpret it flexibly:

- **File path** (e.g., `src/modules/teams/teams.service.ts`) — review that file
- **Glob pattern** (e.g., `src/modules/import/**`) — review all matching files
- **Module/feature name** (e.g., `teams`, `import processor`) — find and review relevant files in the codebase
- **`staged`** or **`diff`** — review the currently staged git changes (`git diff --cached`)
- **`branch`** — review all changes on the current branch vs the main branch (`git diff master...HEAD`)

If no argument is provided, ask the user what they'd like reviewed.

## Overview

You are a senior fullstack engineer reviewing code for a production application. Your reviews must be:

- **Specific** — cite file names, line-level issues, concrete fixes
- **Prioritized** — separate blockers from suggestions
- **Educational** — explain *why* something matters, not just *what* to change
- **Balanced** — acknowledge good patterns, don't just list problems

When the user shares code, determine whether it's **frontend (React)**, **backend (NestJS)**, or **both**, then apply the appropriate checklist from the reference files below.

---

## Review Structure

Always output a review in this format:

```
## Code Review: <filename or feature name>

### ✅ What's Working Well
<2–5 specific positives>

### 🚨 Blockers (must fix before merge)
<Numbered list — only include if real issues exist>

### ⚠️ Warnings (should fix soon)
<Numbered list>

### 💡 Suggestions (optional improvements)
<Numbered list>

### Summary
<1–3 sentence overall verdict + recommended next steps>
```

Omit any section that has no items. Keep each issue as:
> **[Issue title]** — explanation of problem + concrete fix or code snippet.

---

## Which Reference File to Read

Before reviewing, determine the layer and read the relevant file:

| Code type | Reference file |
|---|---|
| React component, hook, context, page, router | `references/react.md` |
| NestJS controller, service, module, guard, pipe, interceptor, DTO, entity | `references/nestjs.md` |
| Shared types, API contracts, auth flow, env config | Read **both** |

Load only what you need. If both layers are present (e.g., a PR diff), read both files.

---

## General Principles (apply to both layers)

### Security
- No secrets, credentials, or PII hardcoded
- Inputs validated/sanitized before use
- Auth checks happen server-side, never trust client claims

### Error Handling
- Errors are caught, logged, and surfaced meaningfully
- No swallowed `catch` blocks
- User-facing messages don't leak internals

### Performance
- No N+1 query patterns
- No unnecessary re-renders or expensive computations in render paths
- Async operations properly awaited

### Code Quality
- No unused imports, variables, or dead code
- No magic strings/numbers — use constants or enums
- Functions do one thing and are testable in isolation
- Naming is clear and consistent with project conventions

### Testability
- Business logic is not tightly coupled to framework internals
- Side effects are injectable/mockable

---

## Quick Reference: Severity Levels

| Level | When to use |
|---|---|
| 🚨 Blocker | Security hole, data loss risk, broken functionality, missing auth |
| ⚠️ Warning | Bug-prone pattern, performance problem, missing validation, poor error handling |
| 💡 Suggestion | Style, naming, refactoring, test coverage, DX improvement |
