# The Groove Archive

Curated DJ set discovery app built with Next.js App Router and Supabase-backed data.

## Stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- Supabase (`@supabase/supabase-js`)
- Vitest (unit tests)

## Environment Variables

Create a `.env` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are required by `src/lib/supabase.ts`.

## Local Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Scripts

- `npm run dev`: start local dev server
- `npm run lint`: run ESLint
- `npm run test`: run Vitest test suite
- `npm run build`: production build
- `npm run start`: run production server

## Main Routes

- `/`: hero + random "serve a set" flow
- `/list`: full set list experience
- `/artists`: artist view grouped by rating
- `/heatmaps`: festival heatmap page with CSV upload/export
- `/suggest`: suggestion form page

## API Routes

- `GET /api/sheets?tabs=list,genres,artists`
  - returns Supabase-backed data payload for selected tabs
- `GET /api/soundcloud-artwork?url=<soundcloud-track-url>`
  - returns SoundCloud artwork via oEmbed with in-memory cache

## Data Notes

- Server-side data fetches are in `src/lib/sheets.server.ts`.
- Root layout loads shared site data once and passes it via `AppShell`/context.
- Supabase tables expected by current code:
  - `sets`
  - `genres`
  - `artists`
  - `festival_sets`
