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

## Visual Checks

- Prefer the stable npm scripts over ad hoc browser shell commands.
- Clean up temporary screenshot files after visual checks when they are not user-requested deliverables.

## Repo Notes

- This repo is often used on Windows, where sandboxed Next/Vitest/Playwright runs may hit `spawn EPERM`.
- When that happens, prefer the stable npm scripts first, then request escalation only when needed.
- CI-style placeholder Supabase envs intentionally disable live Supabase reads; the Playwright fixture path is the expected verification route for CI-style browser checks.
