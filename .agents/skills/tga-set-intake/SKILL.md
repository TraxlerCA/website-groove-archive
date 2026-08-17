---
name: tga-set-intake
description: Research YouTube or SoundCloud DJ-set links for The Groove Archive, extract authoritative metadata and descriptions, find the same recording on the other platform, select an existing genre, check `sets` duplicates, and prepare reviewable SQL. Use for set intake proposals and for a later explicitly approved insert or update with read-back verification.
---

# TGA Set Intake

## Core Rule

Never write to the database during intake preparation. Read from Supabase and the web, then present a proposed `sets` row/update and SQL for review. If the user later asks to execute it, require explicit approval of the exact unchanged rows or SQL and summarize the target project/database, intended change, and expected impact.

Scope database work to:

- `sets`: read existing rows; propose inserts or updates.
- `genres`: read existing rows for `genre_id` selection.

Do not inspect, propose, or mutate `artists`, `heatmaps`, `festival_sets`, or unrelated tables unless the user explicitly expands the task.

## Efficient Intake Order

1. Canonicalize every supplied URL before searching or querying:
   - YouTube: `https://www.youtube.com/watch?v=<video_id>`.
   - SoundCloud: retain the track path and remove sharing/tracking parameters such as `si`, `utm_*`, `c`, `p`, and `ref`.
2. Read platform metadata before broad web search:
   - YouTube: call `https://www.youtube.com/oembed?url=<encoded_canonical_url>&format=json` for title and author. When duration, genre, date, format, or track clues matter, read the public watch page and parse the embedded `ytInitialPlayerResponse.videoDetails` JSON for `lengthSeconds`, `shortDescription`, and keywords. Prefer a configured YouTube Data API when available.
   - SoundCloud: call `https://soundcloud.com/oembed?format=json&url=<encoded_canonical_url>` for title, author, artwork, and the API track id embedded in the player URL. Read the public track page/profile for duration, genre tags, description, and comments when available.
   - Treat the set description as primary evidence. It often states the exact subgenre, event date, whether the mix is all-original, and relevant influences.
   - Search engines can lag behind new uploads. An empty search result, cache miss, or robots error is not evidence that a counterpart does not exist.
3. Search for the same recording on the other platform:
   - Search the exact normalized title first, then artist + event + year/date.
   - Compare title, artist, event/date, duration, description, and tracklist. Allow small duration differences for platform intros/outros, but investigate material differences.
   - Use uploader/profile identity to discover candidates, not as proof that two uploads are the same recording.
   - Do not pair a separate podcast, studio mix, or earlier/later performance merely because it features the same artist.
   - Record evidence and confidence. Keep weak candidates out of the proposed row.
4. Refresh the current database shape before producing SQL:
   - Prefer Supabase MCP read/schema tools when available.
   - Inspect only `sets` and `genres`: columns, nullability, foreign keys, relevant constraints, and existing genre rows.
   - If live schema tools are unavailable, read `references/current-known-schema.md` and say that the schema is repo-derived rather than live-confirmed.
5. Check for existing rows before proposing a change:
   - Search `sets` by exact and normalized `youtube_url`, `soundcloud_url`, and `title`.
   - Inspect existing rows for the artist as classification precedent, without assuming every set by that artist has the same genre.
   - Read existing `genres.label` values and ids.
   - If a row already exists with one platform URL, propose an `update` to fill the missing URL instead of a duplicate insert.
6. Determine genre:
   - Prefer exact existing `genres.label` values from the database.
   - Weight set-specific description, tracklist, tags, and musical style above a generic artist biography or an older database row.
   - Return the selected genre label, `genre_id` when known, confidence, and one short rationale.
   - If no existing genre fits, leave `genre_id` unresolved and ask whether the user wants a new genre. Do not propose a `genres` write unless explicitly asked.
7. Determine rating:
   - Use `🔥🔥` as the intake default unless the user supplies a different rating or asks to leave it blank.
   - Treat rating as curator judgment, not source metadata. Do not derive it from views, likes, comments, or uploader prominence.
   - If the user questions the default, inspect the archive's rated rows for calibration and clearly label the proposed rating as a judgment call.
8. Produce a table-first review packet, not a mutation.

## Tool Fallbacks

- Prefer connected web and Supabase tools when available.
- If generic search/open cannot resolve a platform page, call the platform oEmbed endpoint directly.
- If a sandboxed PowerShell HTTP request fails with a TLS/connection error, retry through the approved network path. A Node `fetch` request is a reliable fallback when available.
- Never print API keys or full environment contents.

## Review Packet Format

Present the main output as one Markdown table, especially for multiple links:

| Title | Genre | Rating | YouTube URL | SoundCloud URL | DB Action | Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |

Column guidance:

- `Title`: normalized `sets.title`.
- `Genre`: selected existing `genres.label`; include `genre_id` in the notes or SQL.
- `Rating`: default to `🔥🔥`; state when it is the intake default rather than user-supplied.
- `YouTube URL` and `SoundCloud URL`: canonical URLs, with `null` when missing.
- `DB Action`: `insert`, `update existing <id>`, or `needs confirmation`.
- `Confidence`: concise confidence for same-set matching and genre selection.
- `Notes`: duration, decisive metadata, existing matches, unresolved questions, or why a counterpart was excluded.

After the table, include:

- `open_questions`: only items that need user confirmation.
- `sql_proposal`: clearly reviewable SQL. Use `insert` for new rows and `update` for filling missing fields.

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

Use one multi-row `insert` for a reviewed batch. When updating an existing row:

```sql
-- Proposed only. Do not execute without approval.
update public.sets
set youtube_url = 'https://www.youtube.com/watch?v=...'
where id = '<existing_set_uuid>'
  and youtube_url is null;
```

## Approved Uploads

Only execute a write after the user explicitly approves the exact table rows or SQL. A clear follow-up such as "insert these" after reviewing unchanged SQL counts as approval. If any field changes after review, show the revised rows/SQL and request approval again.

For approved Supabase REST uploads:

- Immediately preflight exact canonical platform URLs again. In a batch, insert only rows still missing; do not create duplicates.
- Use `SUPABASE_SECRET_KEY`, never a public/anon key.
- Keep the key local/server-only and do not print it.
- Use a non-browser user agent such as `CodexLocalAdmin/1.0` for `sb_secret_...` keys.
- Request `Prefer: return=representation` when using REST.
- Verify every inserted or updated row afterward with read-only `sets` queries by exact canonical URL, including the joined genre label.

## Important Judgment

Treat platform matching as probabilistic. Do not claim the other-platform version is the same set without enough evidence from title, artist, date/event, tracklist, description, or duration. If evidence is thin, say "possible match" and keep the URL out of the proposed row unless the user confirms it.

Use `rating = '🔥🔥'` for new `sets` rows by default. Override it when the user supplies a different rating, asks to leave it blank, or explicitly requests rating calibration.

Read `references/current-known-schema.md` when live Supabase schema access is unavailable or when a quick schema reminder is useful.
