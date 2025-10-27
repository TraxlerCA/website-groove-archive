'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Genre, Row } from '@/lib/types';

export type SiteData = {
  rows: Row[];
  genres: Genre[];
  updatedAt: string;
};

const SiteDataContext = createContext<SiteData | null>(null);

export function SiteDataProvider({ value, children }: { value: SiteData; children: ReactNode }) {
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('SiteDataProvider missing');
  return ctx;
}
