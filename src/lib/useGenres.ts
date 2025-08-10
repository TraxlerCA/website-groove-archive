"use client";
import { useEffect, useMemo, useState } from "react";

export type Genre = { label: string; explanation: string };

type Api = { ok: boolean; data?: { genres?: Genre[] }; error?: string };

export function useGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/sheets?tabs=genres", { cache: "no-store" });
        const json: Api = await r.json();
        if (!json.ok) throw new Error(json.error || "failed to load");
        if (alive) setGenres(json.data?.genres || []);
      } catch (e: any) {
        if (alive) setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // quick lookup map for UI joins
  const byLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of genres) if (g.label) m.set(g.label.toLowerCase(), g.explanation);
    return m;
  }, [genres]);

  return { genres, byLabel, loading, error };
}
