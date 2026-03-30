import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

const EMPTY_QUERY_RESULT: QueryResult = {
  data: [],
  error: null,
};

function createSupabaseMock(results: Record<string, QueryResult>) {
  const select = vi.fn((selection: string) => {
    const lastCall = from.mock.calls.at(-1);
    const selectedTable = lastCall?.at(0);
    const result = typeof selectedTable === 'string' ? (results[selectedTable] ?? EMPTY_QUERY_RESULT) : EMPTY_QUERY_RESULT;

    if (selection === '*') {
      return {
        order: vi.fn(async () => result),
      };
    }

    return Promise.resolve(result);
  });

  const from = vi.fn(() => ({
    select,
  }));

  return {
    from,
  };
}

async function importSheetsServerWithSupabaseMock(
  options: {
    isEnabled?: boolean;
    reason?: string | null;
    results?: Record<string, QueryResult>;
    supabaseOverride?: object | null;
  } = {},
) {
  const {
    isEnabled = true,
    reason = null,
    results = {},
    supabaseOverride,
  } = options;

  const supabase =
    supabaseOverride === undefined ? createSupabaseMock(results) : supabaseOverride;

  vi.resetModules();
  vi.doMock('@/lib/supabase', () => ({
    isSupabaseEnabled: isEnabled,
    supabase,
    supabaseDisabledReason: reason,
  }));

  return import('@/lib/sheets.server');
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock('@/lib/supabase');
});

describe('sheets.server', () => {
  it('returns empty fallback data and logs once when Supabase is disabled', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await importSheetsServerWithSupabaseMock({
      isEnabled: false,
      reason: 'placeholder config',
      supabaseOverride: null,
    });

    await expect(mod.getGenres()).resolves.toEqual([]);
    await expect(mod.getArtists()).resolves.toEqual([]);
    await expect(mod.getListRows()).resolves.toEqual([]);
    await expect(mod.getFestivalSets()).resolves.toEqual([]);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('placeholder config');
  });

  it('returns empty arrays when enabled but no client is available', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await importSheetsServerWithSupabaseMock({
      isEnabled: true,
      supabaseOverride: null,
    });

    await expect(mod.getGenres()).resolves.toEqual([]);
    await expect(mod.getArtists()).resolves.toEqual([]);
    await expect(mod.getListRows()).resolves.toEqual([]);
    await expect(mod.getFestivalSets()).resolves.toEqual([]);
  });

  it('maps successful genres, artists, and list rows', async () => {
    const mod = await importSheetsServerWithSupabaseMock({
      results: {
        artists: {
          data: [{ artist: 'DJ Test', rating: 'hot' }],
          error: null,
        },
        genres: {
          data: [{ label: 'Breaks', explanation: 'Broken beats' }],
          error: null,
        },
        sets: {
          data: [
            {
              genres: { label: 'Breaks' },
              rating: 'blazing',
              soundcloud_url: 'https://soundcloud.test/set',
              title: 'Sunrise Set',
              youtube_url: null,
            },
          ],
          error: null,
        },
      },
    });

    await expect(mod.getGenres()).resolves.toEqual([
      { explanation: 'Broken beats', label: 'Breaks' },
    ]);
    await expect(mod.getArtists()).resolves.toEqual([
      { name: 'DJ Test', rating: 'hot' },
    ]);
    await expect(mod.getListRows()).resolves.toEqual([
      {
        classification: 'Breaks',
        set: 'Sunrise Set',
        soundcloud: 'https://soundcloud.test/set',
        tier: 'blazing',
        youtube: null,
      },
    ]);
  });

  it('logs and returns empty arrays for query errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mod = await importSheetsServerWithSupabaseMock({
      results: {
        artists: {
          data: null,
          error: { message: 'artists down' },
        },
        genres: {
          data: null,
          error: { message: 'genres down' },
        },
        sets: {
          data: null,
          error: { message: 'sets down' },
        },
      },
    });

    await expect(mod.getGenres()).resolves.toEqual([]);
    await expect(mod.getArtists()).resolves.toEqual([]);
    await expect(mod.getListRows()).resolves.toEqual([]);

    expect(errorSpy).toHaveBeenCalledTimes(3);
  });

  it('falls back from festival_sets to heatmaps and logs each failed table once', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await importSheetsServerWithSupabaseMock({
      results: {
        festival_sets: {
          data: null,
          error: { message: 'missing table' },
        },
        heatmaps: {
          data: [{ slug: 'festival-2026' }],
          error: null,
        },
      },
    });

    await expect(mod.getFestivalSets()).resolves.toEqual([{ slug: 'festival-2026' }]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('festival_sets');
  });

  it('returns empty festival data after both candidate tables fail', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mod = await importSheetsServerWithSupabaseMock({
      results: {
        festival_sets: {
          data: null,
          error: { message: 'missing table' },
        },
        heatmaps: {
          data: null,
          error: { message: 'heatmaps down' },
        },
      },
    });

    await expect(mod.getFestivalSets()).resolves.toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(
      'Error fetching festival sets: could not load from festival_sets or heatmaps',
    );
  });

  it('assembles sheet payloads with selected tabs only', async () => {
    const mod = await importSheetsServerWithSupabaseMock({
      results: {
        artists: {
          data: [{ artist: 'DJ Test', rating: 'ok' }],
          error: null,
        },
        genres: {
          data: [{ label: 'House', explanation: '4/4' }],
          error: null,
        },
        sets: {
          data: [],
          error: null,
        },
      },
    });

    const artistsOnly = await mod.getSheets(['artists']);
    expect(artistsOnly.ok).toBe(true);
    expect(artistsOnly.data).toEqual({
      artists: [{ name: 'DJ Test', rating: 'ok' }],
    });
    expect(typeof artistsOnly.updatedAt).toBe('string');

    const allTabs = await mod.getSheets();
    expect(allTabs.data).toEqual({
      artists: [{ name: 'DJ Test', rating: 'ok' }],
      genres: [{ explanation: '4/4', label: 'House' }],
      list: [],
    });
  });
});
