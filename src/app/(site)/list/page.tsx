import { Suspense } from 'react';
import DataUnavailableState from '@/components/DataUnavailableState';
import { getSheets } from '@/lib/sheets.server';
import ListPageClient from './ListPageClient';

export default async function ListPage() {
  const sheets = await getSheets(['list', 'genres']);
  if (!sheets.ok) {
    return <DataUnavailableState />;
  }

  const rows = sheets.data.list ?? [];
  const genres = sheets.data.genres ?? [];

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ListPageClient rows={rows} genres={genres} />
    </Suspense>
  );
}
