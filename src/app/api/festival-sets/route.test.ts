import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/sheets.server', () => ({
  getFestivalSets: vi.fn(),
}));

import { getFestivalSets } from '@/lib/sheets.server';
import { GET } from './route';
import { mapFestivalSetRow } from '@/lib/festivalSetRows';

describe('mapFestivalSetRow', () => {
  it('maps start_time/end_time to start/end', () => {
    const mapped = mapFestivalSetRow({
      festival: 'Dekmantel',
      date: '2026-08-01',
      stage: 'Main',
      artist: 'DJ X',
      start_time: '13:00:00',
      end_time: '14:00:00',
      rating: 'hot',
    });

    expect(mapped.start).toBe('13:00:00');
    expect(mapped.end).toBe('14:00:00');
  });
});

describe('GET /api/festival-sets', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns mapped festival rows', async () => {
    vi.mocked(getFestivalSets).mockResolvedValue([
      {
        festival: 'Dekmantel',
        date: '2026-08-01',
        stage: 'Main',
        stage_order: 1,
        artist: 'DJ X',
        start_time: '13:00:00',
        end_time: '14:00:00',
        rating: 'hot',
      },
    ] as never);

    const res = await GET();
    const json = (await res.json()) as { ok: boolean; data: Array<{ start: string; end: string }> };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data[0]).toMatchObject({ start: '13:00:00', end: '14:00:00' });
  });

  it.each([new Error('Festival data unavailable'), 'Festival data unavailable'])(
    'returns a safe error response when the data source rejects: %s',
    async (failure) => {
      vi.mocked(getFestivalSets).mockRejectedValue(failure);

      const response = await GET();
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        ok: false,
        error: 'Festival data unavailable',
        data: [],
      });
    },
  );

});
