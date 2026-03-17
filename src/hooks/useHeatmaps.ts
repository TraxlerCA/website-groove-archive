'use client';

import { useState, useEffect, useMemo } from 'react';
import { Row, Group, norm, parseDate, slugify, loadPapa } from '@/lib/heatmaps';

export function useHeatmaps(csvUrl?: string | null) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const normalizeRows = (input: Row[]) => input
      .map(r => ({
        festival: norm(r.festival),
        date: norm(r.date),
        stage: norm(r.stage),
        stage_order: Number(r.stage_order ?? 9999),
        artist: norm(r.artist),
        start: norm(r.start || (r as any).start_time), // handle both field names for safety
        end: norm(r.end || (r as any).end_time),
        rating: norm(r.rating || ''),
      }))
      .filter(r => r.festival && r.date && r.stage && r.artist && r.start && r.end);

    (async () => {
      try {
        setLoading(true);
        if (csvUrl) {
          const Papa = await loadPapa();
          Papa.parse<Row>(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (res) => {
              if (cancelled) return;
              setRows(normalizeRows(res.data || []));
              setLoading(false);
            },
            error: (err) => {
              if (cancelled) return;
              setError(err.message);
              setLoading(false);
            }
          });
          return;
        }

        const response = await fetch('/api/festival-sets', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch from API');
        const payload = await response.json() as { ok?: boolean; data?: Row[] };
        
        if (!cancelled) {
          setRows(normalizeRows(payload.data || []));
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load heatmaps');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [csvUrl]);

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    for (const r of rows) {
      const key = `${r.festival}__${r.date}`;
      if (!map.has(key)) map.set(key, { title: r.festival, date: r.date, rows: [], key });
      map.get(key)!.rows.push(r);
    }
    // Already sorted by Supabase query, but ensuring group ordering here too
    return Array.from(map.values()).sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [rows]);

  const getBySlug = (slug: string) => {
    return groups.find(g => slugify(`${g.title}-${g.date}`) === slug);
  };

  return { rows, groups, getBySlug, loading, error };
}
