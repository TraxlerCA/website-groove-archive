import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import DataUnavailableState from '@/components/DataUnavailableState';
import { PlayerProvider } from '@/context/PlayerProvider';
import type { SiteData } from '@/context/SiteDataContext';
import { getSheets } from '@/lib/sheets.server';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const sheets = await getSheets(['list', 'genres']);
  if (!sheets.ok) {
    return <DataUnavailableState />;
  }

  const data: SiteData = {
    rows: sheets.data.list ?? [],
    genres: sheets.data.genres ?? [],
    updatedAt: sheets.updatedAt,
  };

  return (
    <PlayerProvider>
      <AppShell data={data}>{children}</AppShell>
    </PlayerProvider>
  );
}
