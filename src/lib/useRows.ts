"use client";
import { useEffect, useState } from "react";

export type Row = {
  set: string;
  classification: string | null;
  soundcloud: string | null;
  youtube: string | null;
  tier: string | null;
};

type Api = { ok: boolean; data?: { list?: Row[] }; error?: string };

export function useRows() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/sheets?tabs=list", { cache: "no-store" });
        const json: Api = await r.json();
        if (!json.ok) throw new Error(json.error || "failed to load");
        if (alive) setRows(json.data?.list || []);
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { rows, loading, error };
}
