-- PROPOSED ONLY — do not execute without approval for this exact statement.
-- The Groove Archive Supabase project: wwsiitqsrtawewlsurha.
-- Event: Overbruggen Kyle Starkey Invites, 2026-10-24, Pllek, Amsterdam.
-- This fills the announced timetable and preserves unlisted artist ratings.
-- Ratings explicitly chosen previously: NewTone/Kyle Starkey/Olive Anguz = blazing;
-- CVNTS/WOLTERS = ok; Entasia/Club Angel = hot.
-- Stage order 1 = Arena, 2 = Club.
-- The app reads festival_sets first, then the legacy heatmaps table.
-- Select whichever table actually contains the event. Abort if the expected
-- eleven distinct artist records are not present. Do not insert extra rows.

BEGIN;

DO $$
DECLARE
  target_table regclass;
  event_count integer;
  affected integer;
BEGIN
  IF to_regclass('public.festival_sets') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.festival_sets WHERE festival = $1 AND date = $2'
      INTO event_count
      USING 'Overbruggen Kyle Starkey Invites', DATE '2026-10-24';
    IF event_count > 0 THEN
      target_table := to_regclass('public.festival_sets');
    END IF;
  END IF;

  IF target_table IS NULL AND to_regclass('public.heatmaps') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.heatmaps WHERE festival = $1 AND date = $2'
      INTO event_count
      USING 'Overbruggen Kyle Starkey Invites', DATE '2026-10-24';
    IF event_count > 0 THEN
      target_table := to_regclass('public.heatmaps');
    END IF;
  END IF;

  IF target_table IS NULL THEN
    RAISE EXCEPTION 'Overbruggen event not found in festival_sets or heatmaps; no changes made';
  END IF;
  IF event_count <> 11 THEN
    RAISE EXCEPTION 'Expected 11 Overbruggen rows in %, found %; no changes made', target_table, event_count;
  END IF;

  EXECUTE format($update$
    UPDATE %s AS h
       SET stage = slots.stage,
           stage_order = slots.stage_order,
           start_time = slots.start_time::time,
           end_time = slots.end_time::time,
           rating = COALESCE(slots.rating, h.rating)
      FROM (VALUES
        ('Inafekt',      'Arena', 1, '15:00', '16:30', NULL::text),
        ('Sensu',        'Arena', 1, '15:00', '16:30', NULL::text),
        ('NewTone',      'Arena', 1, '16:30', '18:00', 'blazing'),
        ('WOLTERS',      'Arena', 1, '18:00', '20:00', 'ok'),
        ('Kyle Starkey', 'Arena', 1, '20:00', '23:00', 'blazing'),
        ('CVNTS',        'Club',  2, '15:00', '16:30', 'ok'),
        ('Entasia',      'Club',  2, '16:30', '18:30', 'hot'),
        ('Ned Bennett',  'Club',  2, '16:30', '18:30', NULL::text),
        ('Club Angel',   'Club',  2, '18:30', '20:30', 'hot'),
        ('Olive Anguz',  'Club',  2, '20:30', '23:00', 'blazing'),
        ('STÜM',         'Club',  2, '20:30', '23:00', NULL::text)
      ) AS slots(artist, stage, stage_order, start_time, end_time, rating)
     WHERE h.festival = 'Overbruggen Kyle Starkey Invites'
       AND h.date = DATE '2026-10-24'
       AND lower(btrim(h.artist)) = lower(btrim(slots.artist))
  $update$, target_table);

  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 11 THEN
    RAISE EXCEPTION 'Expected 11 matched artist updates in %, got %; transaction rolled back', target_table, affected;
  END IF;

  RAISE NOTICE 'Updated % Overbruggen rows in %', affected, target_table;
END
$$;

COMMIT;

-- After executing, verify by read-only SELECT from the table named in NOTICE:
-- SELECT artist, stage, stage_order, start_time, end_time, rating
-- FROM public.heatmaps -- or public.festival_sets
-- WHERE festival = 'Overbruggen Kyle Starkey Invites' AND date = '2026-10-24'
-- ORDER BY stage_order, start_time, artist;
