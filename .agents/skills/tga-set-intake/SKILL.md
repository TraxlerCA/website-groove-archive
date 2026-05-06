---
name: tga-set-intake
description: Prepare SQL database update suggestions for The Groove Archive `sets` table from one or more YouTube or SoundCloud set links. Use when the user supplies YouTube/SoundCloud URLs and wants Codex to research the set, find the matching link on the other platform, infer an existing `genres` row, check existing `sets` data, and present a reviewable SQL proposal without executing database writes.
---

# TGA Set Intake

## Core Rule

Never write to the database as part of this skill. Read freely from Supabase and the web, then present a proposed `sets` row/update and SQL for user review. If the user later asks to execute the SQL, request explicit approval first and summarize the target project/database, intended change, and expected impact.

Scope database work to:

- `sets`: read existing rows; propose inserts or updates.
- `genres`: read existing rows for `genre_id` selection.

Do not inspect, propose, or mutate `artists`, `heatmaps`, `festival_sets`, or unrelated tables unless the user explicitly expands the task.

## Workflow

1. Parse every supplied URL and identify platform, canonical URL, likely title, artist/display name, duration, and any event/date clues.
2. Search the web for the same set on the other platform:
   - For a YouTube URL, search SoundCloud.
   - For a SoundCloud URL, search YouTube.
   - Use title, artist, event, date, tracklist, and duration as matching signals.
   - Ignore uploader/channel/account as a decision field unless the user specifically asks about source provenance.
   - Record evidence and confidence.
3. Refresh the current database shape before producing SQL:
   - Prefer Supabase MCP read/schema tools when available.
   - Inspect only `sets` and `genres`: columns, nullability, foreign keys, relevant constraints, and existing genre rows.
   - If live schema tools are unavailable, read `references/current-known-schema.md` and say that the schema is repo-derived rather than live-confirmed.
4. Check for existing rows before proposing a change:
   - Search `sets` by exact and normalized `youtube_url`, `soundcloud_url`, and `title`.
   - Read existing `genres.label` values and ids.
   - If a row already exists with one platform URL, propose an `update` to fill the missing URL instead of a duplicate insert.
5. Determine genre:
   - Prefer exact existing `genres.label` values from the database.
   - Use the set's metadata, artist context, tracklist, comments/description, and musical style.
   - Return the selected genre label, `genre_id` when known, confidence, and one short rationale.
   - If no existing genre fits, leave `genre_id` unresolved and ask the user whether they want a new genre. Do not propose a `genres` write unless the user explicitly asks for it.
6. Use `🔥🔥` as the default `sets.rating` value unless the user explicitly provides a different rating.
7. Produce a table-first review packet, not a mutation.

## Review Packet Format

Present the main output as one Markdown table, especially when the user supplied multiple links. Include these columns:

| Title | Genre | Rating | YouTube URL | SoundCloud URL | DB Action | Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |

Column guidance:

- `Title`: normalized `sets.title`.
- `Genre`: selected existing `genres.label`; include `genre_id` in the notes or SQL below.
- `Rating`: default to `🔥🔥`.
- `YouTube URL` and `SoundCloud URL`: canonical URLs, with `null` when missing.
- `DB Action`: `insert`, `update existing <id>`, or `needs confirmation`.
- `Confidence`: concise confidence for same-set matching and genre selection.
- `Notes`: existing match, unresolved questions, or why a counterpart link was excluded.

After the table, include:

- `open_questions`: only items that need user confirmation.
- `sql_proposal`: parameterized or clearly reviewable SQL. Use `insert` for new rows and `update` for filling missing fields on existing rows.

## SQL Style

Prefer SQL that is easy to review:

```sql
-- Proposed only. Do not execute without approval.
insert into public.sets (title, genre_id, rating, soundcloud_url, youtube_url)
values (
  'Artist - Set title',
  '<genre_uuid>',
  '🔥🔥',
  'https://soundcloud.com/...',
  'https://www.youtube.com/watch?v=...'
);
```

When updating an existing row:

```sql
-- Proposed only. Do not execute without approval.
update public.sets
set youtube_url = 'https://www.youtube.com/watch?v=...'
where id = '<existing_set_uuid>'
  and youtube_url is null;
```

## Approved Uploads

Only execute a write after the user explicitly approves the exact table rows or SQL. For approved Supabase REST uploads:

- Use `SUPABASE_SECRET_KEY`, never a public/anon key.
- Keep the key local/server-only and do not print it.
- Use a non-browser user agent such as `CodexLocalAdmin/1.0` for `sb_secret_...` keys.
- Verify the inserted or updated rows afterward with read-only `sets` queries by exact URL.

## Important Judgement

Treat platform matching as probabilistic. Do not claim the other-platform version is the same set unless there is enough evidence from title, artist, date/event, tracklist, or duration. If evidence is thin, say "possible match" and keep the URL out of the proposed row unless the user confirms it.

Use `rating = '🔥🔥'` for new `sets` rows by default. Override it only when the user supplies a different rating or asks to leave it blank.

Read `references/current-known-schema.md` when live Supabase schema access is not available or when a quick schema reminder is useful.
