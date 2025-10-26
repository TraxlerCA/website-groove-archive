"use client";
import { useSiteData } from "@/context/SiteDataContext";
import type { Row } from "@/lib/types";

export type { Row };

export function useRows() {
  const { rows } = useSiteData();
  return { rows, loading: false, error: null as string | null };
}
