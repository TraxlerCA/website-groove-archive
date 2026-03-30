# The Groove Archive

Curated DJ set discovery app built with Next.js App Router and Supabase-backed data.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Supabase (`@supabase/supabase-js`)
- Vitest for unit tests
- Playwright for browser smoke coverage

## Quickstart

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local env file from the template:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Fill in the required Supabase values in `.env`.
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Optional: map (default) or crate
NEXT_PUBLIC_HOME_EXPERIENCE=map
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are read by `src/lib/supabase.ts`. Placeholder values intentionally disable live Supabase reads and fall back to empty data.

## Scripts

- `npm run dev`: start the local dev server
- `npm run lint`: run ESLint across app code and `scripts/**`
- `npm run typecheck`: run TypeScript in no-emit mode
- `npm run check`: fast local sanity pass (`lint` + `typecheck`)
- `npm run test`: run Vitest
- `npm run test:coverage`: run Vitest with coverage thresholds
- `npm run test:e2e`: run Playwright
- `npm run test:e2e:headed`: run Playwright in headed mode
- `npm run generate:ggw-zones`: regenerate map GeoJSON + active-area lists from the GGW CSV mapping
- `npm run logs:supabase -- <path-to-log.json>`: summarize a Supabase edge log event
- `npm run build`: create a production build
- `npm run start`: start the production server

## App Structure

- `src/app/layout.tsx` defines global metadata, fonts, and the root HTML shell.
- `src/app/(site)/layout.tsx` is the live-site bootstrap: it loads shared sheet data once and wraps the site in `AppShell` + `PlayerProvider`.
- `src/lib/sheets.server.ts` is the server data entry point for list, genre, artist, and festival-set data.
- `src/context/SiteDataContext.tsx` exposes shared rows, genres, and timestamps to client components.
- `src/app/(site)/page.tsx` switches the home experience between map and crate modes via `NEXT_PUBLIC_HOME_EXPERIENCE`.

## Routes

- Main site routes live in the `(site)` route group and keep clean public URLs:
  - `/`
  - `/crate`
  - `/list`
  - `/artists`
  - `/heatmaps`
  - `/suggest`
- `/cabra` remains a temporary standalone side route.
- API routes:
  - `GET /api/sheets?tabs=list,genres,artists`
  - `GET /api/soundcloud-artwork?url=<soundcloud-track-url>`
  - `GET /api/festival-sets`

## Supabase Log Triage

Use the helper script with either a file path or stdin:

```bash
npm run logs:supabase -- ./event.json
# or
cat event.json | npm run logs:supabase
```

The report includes request metadata, a `riskLevel`/`riskScore`, bot heuristics, and follow-up recommendations for RLS and rate-limiting checks.

## Data Notes

- Map GGW source-of-truth mapping: `src/data/amsterdam-ggw-mapping.csv`
- Generated map artifacts:
  - `src/data/amsterdam-ggw-zones.json`
  - `src/data/amsterdam-ggw-zone-areas.json`
- Current Supabase tables used by the app:
  - `sets`
  - `genres`
  - `artists`
  - `festival_sets`
