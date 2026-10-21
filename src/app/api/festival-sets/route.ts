import { NextResponse } from 'next/server';
import { getFestivalSets } from '@/lib/sheets.server';
import { mapFestivalSetRow, type FestivalSetRow } from '@/lib/festivalSetRows';

export const dynamic = 'force-dynamic';

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
