# The Groove Archive

Curated DJ set discovery app built with Next.js App Router and Supabase-backed data.

## Stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- Supabase (`@supabase/supabase-js`)
- Vitest (unit tests)
- Playwright (e2e smoke tests)

## Contributor Quickstart

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create local env file from the template:
   - macOS/Linux:
     ```bash
     cp .env.example .env
     ```
   - Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
3. Fill in required Supabase values in `.env`.
4. Start local dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env` and set values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Optional: map (default) or crate
NEXT_PUBLIC_HOME_EXPERIENCE=map
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required by `src/lib/supabase.ts`.

## Scripts

- `npm run dev`: start local dev server
- `npm run lint`: run ESLint
- `npm run test`: run Vitest test suite
- `npm run test:e2e`: run Playwright e2e suite
- `npm run test:e2e:headed`: run Playwright e2e suite in headed mode
- `npm run generate:ggw-zones`: regenerate map GeoJSON + active-area lists from GGW CSV mapping
- `npm run build`: production build
- `npm run start`: run production server

## Architecture and Data Flow

- Server data entry point: `src/lib/sheets.server.ts`.
- App bootstrap: `src/app/layout.tsx` loads shared datasets once (`list`, `genres`, `artists`) and passes them into `AppShell`.
- Client data access: `SiteDataContext` (`src/context/SiteDataContext.tsx`) exposes rows/genres/updatedAt to client components.
- Home mode switch: `src/app/page.tsx` selects map or crate experience via `NEXT_PUBLIC_HOME_EXPERIENCE`.
- API fallback/access points:
  - `GET /api/sheets?tabs=list,genres,artists`
  - `GET /api/soundcloud-artwork?url=<soundcloud-track-url>`

## Main Routes

- `/`: home experience (map or crate mode)
- `/list`: full set list experience
- `/artists`: artist view grouped by rating
- `/heatmaps`: festival heatmap page with CSV upload/export
- `/suggest`: suggestion form page

## Data Notes

- Map GGW source-of-truth mapping is `src/data/amsterdam-ggw-mapping.csv`.
- Generated map artifacts:
  - `src/data/amsterdam-ggw-zones.json`
  - `src/data/amsterdam-ggw-zone-areas.json`
- Supabase tables expected by current code:
  - `sets`
  - `genres`
  - `artists`
  - `festival_sets`
