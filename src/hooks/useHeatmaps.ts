'use client';

import { useState, useEffect, useMemo } from 'react';
import { Row, Group, DEFAULT_CSV, loadPapa, norm, parseDate, slugify } from '@/lib/heatmaps';

export function useHeatmaps(csvUrl: string = DEFAULT_CSV) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const Papa = await loadPapa();
        Papa.parse<Row>(csvUrl, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            if (cancelled) return;
            const clean = (res.data || [])
              .map(r => ({
                festival: norm(r.festival),
                date: norm(r.date),
                stage: norm(r.stage),
                stage_order: Number(r.stage_order ?? 9999),
                artist: norm(r.artist),
                start: norm(r.start),
                end: norm(r.end),
                rating: norm(r.rating || ''),
              }))
              .filter(r => r.festival && r.date && r.stage && r.artist && r.start && r.end);
            setRows(clean);
            setLoading(false);
          },
          error: (err) => {
            if (cancelled) return;
            setError(err.message);
            setLoading(false);
          }
        });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load heatmaps');
        setLoading(false);
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
    return Array.from(map.values()).sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [rows]);

  const getBySlug = (slug: string) => {
    return groups.find(g => slugify(`${g.title}-${g.date}`) === slug);
  };

  return { rows, groups, getBySlug, loading, error };
}
