'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Row, Group, norm, parseDate, slugify } from '@/lib/heatmaps';

export function useHeatmaps() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data, error: sbError } = await supabase
          .from('heatmaps')
          .select('*')
          .order('date', { ascending: false });

        if (sbError) throw sbError;

        if (!cancelled) {
          const clean = (data || [])
            .map(r => ({
              festival: norm(r.festival),
              date: norm(r.date),
              stage: norm(r.stage),
              stage_order: Number(r.stage_order ?? 9999),
              artist: norm(r.artist),
              start: norm(r.start_time),
              end: norm(r.end_time),
              rating: norm(r.rating || ''),
            }))
            .filter(r => r.festival && r.date && r.stage && r.artist && r.start && r.end);
          
          setRows(clean);
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
  }, []);

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
