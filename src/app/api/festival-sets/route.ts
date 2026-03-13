import { NextResponse } from 'next/server';
import { getFestivalSets } from '@/lib/sheets.server';

export const dynamic = 'force-dynamic';

type FestivalSetRow = {
  festival?: string | null;
  date?: string | null;
  stage?: string | null;
  stage_order?: number | string | null;
  artist?: string | null;
  start?: string | null;
  end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  rating?: string | null;
};

export function mapFestivalSetRow(row: FestivalSetRow) {
  return {
    festival: row.festival ?? '',
    date: row.date ?? '',
    stage: row.stage ?? '',
    stage_order: row.stage_order ?? 9999,
    artist: row.artist ?? '',
    start: row.start ?? row.start_time ?? '',
    end: row.end ?? row.end_time ?? '',
    rating: row.rating ?? '',
  };
}

export async function GET() {
  try {
    const data = await getFestivalSets();
    const mapped = (data as FestivalSetRow[]).map(mapFestivalSetRow);
    return NextResponse.json({ ok: true, data: mapped }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error), data: [] },
      { status: 500 },
    );
  }
}
