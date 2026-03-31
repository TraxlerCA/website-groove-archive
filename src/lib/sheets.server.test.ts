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
    useFixtureData?: boolean;
  } = {},
) {
  const {
    isEnabled = true,
    reason = null,
    results = {},
    supabaseOverride,
    useFixtureData = false,
  } = options;

  const supabase =
    supabaseOverride === undefined ? createSupabaseMock(results) : supabaseOverride;

  vi.resetModules();
  if (useFixtureData) {
    process.env.TGA_USE_FIXTURE_DATA = '1';
  } else {
    delete process.env.TGA_USE_FIXTURE_DATA;
  }
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
  delete process.env.TGA_USE_FIXTURE_DATA;
});

describe('sheets.server', () => {
  it('returns empty fallback arrays and logs once when Supabase is disabled', async () => {
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

  it('logs and returns empty arrays for query errors in compatibility getters', async () => {
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

  it('returns an unavailable payload when Supabase is disabled', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await importSheetsServerWithSupabaseMock({
      isEnabled: false,
      reason: 'placeholder config',
      supabaseOverride: null,
    });

    await expect(mod.getSheets(['list'])).resolves.toEqual({
      ok: false,
      updatedAt: expect.any(String),
      error: {
        code: 'supabase_disabled',
        message: 'Archive data is temporarily unavailable.',
        failedTab: 'list',
      },
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns an unavailable payload when a requested tab query fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mod = await importSheetsServerWithSupabaseMock({
      results: {
        artists: {
          data: null,
          error: { message: 'artists down' },
        },
      },
    });

    await expect(mod.getSheets(['artists'])).resolves.toEqual({
      ok: false,
      updatedAt: expect.any(String),
      error: {
        code: 'query_failed',
        message: 'Archive data could not be loaded.',
        failedTab: 'artists',
      },
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('stops without returning partial data when a later requested tab fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mod = await importSheetsServerWithSupabaseMock({
      results: {
        genres: {
          data: [{ label: 'House', explanation: '4/4' }],
          error: null,
        },
        artists: {
          data: null,
          error: { message: 'artists down' },
        },
      },
    });

    await expect(mod.getSheets(['genres', 'artists'])).resolves.toEqual({
      ok: false,
      updatedAt: expect.any(String),
      error: {
        code: 'query_failed',
        message: 'Archive data could not be loaded.',
        failedTab: 'artists',
      },
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
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

  it('assembles successful sheet payloads with selected tabs only', async () => {
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

    await expect(mod.getSheets(['artists'])).resolves.toEqual({
      ok: true,
      updatedAt: expect.any(String),
      data: {
        artists: [{ name: 'DJ Test', rating: 'ok' }],
      },
    });

    await expect(mod.getSheets()).resolves.toEqual({
      ok: true,
      updatedAt: expect.any(String),
      data: {
        artists: [{ name: 'DJ Test', rating: 'ok' }],
        genres: [{ explanation: '4/4', label: 'House' }],
        list: [],
      },
    });
  });

  it('ignores unknown tab names and preserves current tab filtering behavior', async () => {
    const mod = await importSheetsServerWithSupabaseMock({
      results: {
        genres: {
          data: [{ label: 'Ambient', explanation: 'Drifting' }],
          error: null,
        },
      },
    });

    await expect(mod.getSheets(['unknown', 'genres'])).resolves.toEqual({
      ok: true,
      updatedAt: expect.any(String),
      data: {
        genres: [{ label: 'Ambient', explanation: 'Drifting' }],
      },
    });
  });

  it('returns fixture site data when the fixture env flag is enabled', async () => {
    const mod = await importSheetsServerWithSupabaseMock({
      isEnabled: false,
      reason: 'placeholder config',
      supabaseOverride: null,
      useFixtureData: true,
    });

    await expect(mod.getSheets()).resolves.toEqual({
      ok: true,
      updatedAt: expect.any(String),
      data: {
        artists: expect.arrayContaining([
          expect.objectContaining({ name: 'Demi Riquisimo', rating: 'blazing' }),
        ]),
        genres: expect.arrayContaining([
          expect.objectContaining({ label: 'House' }),
        ]),
        list: expect.arrayContaining([
          expect.objectContaining({ set: 'Live from Lost Village - Demi Riquisimo b2b Nyra' }),
        ]),
      },
    });
  });
});
