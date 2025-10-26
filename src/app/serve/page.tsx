import type { Genre, Row } from '@/lib/types';
import { getSheets } from '@/lib/sheets.server';
import ServePageClient from './ServePageClient';

export default async function ServePage() {
  const sheets = await getSheets();
  const rows = (sheets.data.list ?? []) as Row[];
  const genres = (sheets.data.genres ?? []) as Genre[];

  return <ServePageClient rows={rows} genres={genres} />;
}
