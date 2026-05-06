# Current Known TGA Supabase Schema For Set Intake

This reference is derived from `website-tga` repo docs, app queries, and read-only Supabase REST probes as of 2026-05-04. Prefer live Supabase MCP schema inspection when available, but scope this skill to `sets` and `genres`.

Project ref used by the repo MCP config: `wwsiitqsrtawewlsurha`.

## Tables Used By This Skill

### `public.genres`

Stores genre definitions.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `label` | `text` | Unique, not null |
| `explanation` | `text` | Optional description |

App query: `select label, explanation from genres`.

### `public.sets`

Main set list table.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `title` | `text` | Not null |
| `genre_id` | `uuid` | Foreign key to `genres.id` |
| `rating` | `text` | Optional set tier/rating; live rows use literal flame strings such as `🔥`, `🔥🔥`, `🔥🔥🔥` |
| `soundcloud_url` | `text` | Optional SoundCloud URL |
| `youtube_url` | `text` | Optional YouTube URL |
| `created_at` | `timestamptz` | Default `now()` |

App query:

```sql
select
  title,
  rating,
  soundcloud_url,
  youtube_url,
  genres ( label )
from sets;
```

The app maps `sets.title` to `Row.set`, `genres.label` to `Row.classification`, `soundcloud_url` to `Row.soundcloud`, `youtube_url` to `Row.youtube`, and `rating` to `Row.tier`.

## Live Confirmed Public REST Surface

Read-only anon-key probes confirmed these selectable columns on 2026-05-04:

- `genres`: `id`, `label`, `explanation`
- `sets`: `id`, `title`, `genre_id`, `rating`, `soundcloud_url`, `youtube_url`, `created_at`

The Supabase OpenAPI schema endpoint required a secret key, so use authenticated Supabase MCP for a truly complete schema, constraints, indexes, and policies.

## Rating Convention

Read-only probes confirmed `sets.rating` values are stored as literal flame strings. For intake proposals, default new rows to:

```sql
'🔥🔥'
```

Use another rating only when the user supplies it explicitly.

## Current Genre Rows

Refresh from Supabase before use when possible. Last read-only confirmed genre rows:

| Label | ID |
| --- | --- |
| `Breaks & Experimental` | `90461f6d-136c-4bc4-9781-8f58666e3e22` |
| `Chill & Organic Electronica` | `66552b98-457c-4ecd-a62f-4e7478148cc5` |
| `Classic House & Garage` | `e1a57594-3584-4946-8ab7-50981fe47655` |
| `Disco & Funky House` | `51cfcfc3-416d-43d4-a55f-1c1983ee7994` |
| `Festival Anthems & Big Room` | `cc556fd6-a52b-464b-8ab9-244c3e0a066d` |
| `Hard & Driving Techno` | `a8633ed2-86aa-4890-92af-66ed07c8ffc7` |
| `Melodic House & Techno` | `be08ede1-4f75-495a-9cd7-798c8944166f` |
| `Minimal & Deep House` | `6d08003b-c495-4c98-8f12-170ece61a087` |
| `Pop Edits & Party Remixes` | `3c736e07-7acc-482c-aa22-ecab439400e9` |
| `Trance & High Energy Rave` | `cef7c094-2ee1-4d27-97a8-561446387e17` |

## Expected Read Checks

Before proposing SQL for a link intake:

```sql
select id, label, explanation from public.genres order by label;

select id, title, genre_id, rating, soundcloud_url, youtube_url
from public.sets
where soundcloud_url = '<canonical_soundcloud_url>'
   or youtube_url = '<canonical_youtube_url>'
   or lower(title) = lower('<normalized_title>');
```

Use broader title matching when exact matching fails.
