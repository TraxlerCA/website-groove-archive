import { Suspense } from 'react';
import type { Genre, Row } from '@/lib/types';
import { getSheets } from '@/lib/sheets.server';
import ListPageClient from './ListPageClient';

export default async function ListPage() {
  const sheets = await getSheets();
  const rows = (sheets.data.list ?? []) as Row[];
  const genres = (sheets.data.genres ?? []) as Genre[];

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ListPageClient rows={rows} genres={genres} />
    </Suspense>
  );
}
