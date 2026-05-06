# AGENTS.md

## Preferred Commands

- Prefer `npm run ci:local` for a full CI-style local verification pass.
- Prefer `npm run visual:smoke` for targeted homepage and heatmaps browser checks.
- Prefer `npm run e2e:ci` when you need the full Playwright suite with CI-style placeholder envs.
- Avoid inline PowerShell env wrappers when a package script already exists.

## Git Workflow

- Prefer short-lived `codex/*` branches for implementation work.
- Do not merge without explicit user approval.
- Do not stage or commit screenshots, temporary browser captures, or other local debug artifacts unless explicitly asked.

## Database Safety

- Reading from databases, including Supabase, does not require prior approval.
- Ask for explicit user approval before any destructive or mutating database action, including inserts, updates, deletes, migrations, schema changes, truncates, RPC calls with side effects, or write-capable MCP/tool calls.
- Before requesting approval for a database mutation, summarize the target project/database, intended change, and expected impact.
- For database writes, show the exact rows or SQL before requesting approval, then verify the mutation afterward with a read-only query.
- Local Supabase admin writes use `SUPABASE_SECRET_KEY` only in server/local tooling; never use a `NEXT_PUBLIC_` name for secret or service-role keys.
- When using a Supabase `sb_secret_...` key through REST, send a non-browser user agent so Supabase accepts it as protected-environment tooling.

## Repo Agent Assets

- The repo copy of the TGA set-intake skill lives at `.agents/skills/tga-set-intake`.
- Keep the repo copy and any installed global copy in sync when changing the set-intake workflow.

## Visual Checks

- Prefer the stable npm scripts over ad hoc browser shell commands.
- Clean up temporary screenshot files after visual checks when they are not user-requested deliverables.

## Repo Notes

- This repo is often used on Windows, where sandboxed Next/Vitest/Playwright runs may hit `spawn EPERM`.
- When that happens, prefer the stable npm scripts first, then request escalation only when needed.
- CI-style placeholder Supabase envs intentionally disable live Supabase reads; the Playwright fixture path is the expected verification route for CI-style browser checks.
