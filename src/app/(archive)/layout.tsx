import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import { PlayerProvider } from '@/context/PlayerProvider';
import type { SiteData } from '@/context/SiteDataContext';
import { getSheets } from '@/lib/sheets.server';
import type { Genre, Row } from '@/lib/types';

export default async function ArchiveLayout({ children }: { children: ReactNode }) {
  const sheets = await getSheets();
  const data: SiteData = {
    rows: (sheets.data.list ?? []) as Row[],
    genres: (sheets.data.genres ?? []) as Genre[],
    updatedAt: sheets.updatedAt,
  };

  return (
    <PlayerProvider>
      <AppShell data={data}>{children}</AppShell>
    </PlayerProvider>
  );
}
