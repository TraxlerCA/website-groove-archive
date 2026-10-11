-- Target: TGA Supabase wwsiitqsrtawewlsurha, public.heatmaps.
-- Allow genuine lineup rows without inventing stage assignments or set times.
-- Existing heatmap values are unchanged.
ALTER TABLE public.heatmaps
  ALTER COLUMN stage DROP NOT NULL,
  ALTER COLUMN start_time DROP NOT NULL,
  ALTER COLUMN end_time DROP NOT NULL;

INSERT INTO public.heatmaps (festival, date, stage, artist, start_time, end_time, rating)
SELECT 'Overbruggen Kyle Starkey Invites', DATE '2026-10-24', NULL,
       lineup.artist, NULL, NULL, lineup.rating
FROM (VALUES
  ('Club Angel', NULL::text),
  ('CVNTS', NULL::text),
  ('Entasia', NULL::text),
  ('Ned Bennett', NULL::text),
  ('Inafekt', NULL::text),
  ('Sensu', NULL::text),
  ('Kyle Starkey', 'blazing'),
  ('NewTone', NULL::text),
  ('Olive Anguz', 'blazing'),
  ('STÜM', NULL::text),
  ('WOLTERS', NULL::text)
) AS lineup(artist, rating)
WHERE NOT EXISTS (
  SELECT 1 FROM public.heatmaps existing
  WHERE existing.festival = 'Overbruggen Kyle Starkey Invites'
    AND existing.date = DATE '2026-10-24'
    AND existing.artist = lineup.artist
)
RETURNING festival, date, artist, rating, stage, start_time, end_time;
