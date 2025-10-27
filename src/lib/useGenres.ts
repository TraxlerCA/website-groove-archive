"use client";
import { useMemo } from "react";
import { useSiteData } from "@/context/SiteDataContext";
import type { Genre } from "@/lib/types";

export type { Genre };

export function useGenres() {
  const { genres } = useSiteData();

  const byLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of genres) if (g.label) m.set(g.label.toLowerCase(), g.explanation);
    return m;
  }, [genres]);

  return { genres, byLabel, loading: false, error: null as string | null };
}
