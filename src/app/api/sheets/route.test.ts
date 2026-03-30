import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/sheets.server', () => ({
  getSheets: vi.fn(),
}));

import { getSheets } from '@/lib/sheets.server';
import { GET } from './route';

describe('GET /api/sheets', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns a 200 payload when sheet data loads successfully', async () => {
    vi.mocked(getSheets).mockResolvedValue({
      ok: true,
      updatedAt: '2026-03-30T12:00:00.000Z',
      data: {
        list: [],
      },
    });

    const res = await GET(new Request('https://example.com/api/sheets?tabs=list'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(json).toEqual({
      ok: true,
      updatedAt: '2026-03-30T12:00:00.000Z',
      data: { list: [] },
    });
  });

  it('returns a 503 payload for expected sheet availability failures', async () => {
    vi.mocked(getSheets).mockResolvedValue({
      ok: false,
      updatedAt: '2026-03-30T12:00:00.000Z',
      error: {
        code: 'query_failed',
        message: 'Archive data could not be loaded.',
        failedTab: 'genres',
      },
    });

    const res = await GET(new Request('https://example.com/api/sheets?tabs=genres'));
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json).toEqual({
      ok: false,
      updatedAt: '2026-03-30T12:00:00.000Z',
      error: {
        code: 'query_failed',
        message: 'Archive data could not be loaded.',
        failedTab: 'genres',
      },
    });
  });

  it('returns a 500 payload for unexpected route exceptions', async () => {
    vi.mocked(getSheets).mockRejectedValue(new Error('boom'));

    const res = await GET(new Request('https://example.com/api/sheets'));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(json).toEqual({ ok: false, error: 'boom' });
  });
});
