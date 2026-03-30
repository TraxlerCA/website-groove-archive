import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}), { virtual: true });

const originalEnv = {
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
};

async function importSupabaseModule() {
  vi.resetModules();
  return import('@/lib/supabase');
}

async function importSheetsServerModule() {
  vi.resetModules();
  return import('@/lib/sheets.server');
}

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  vi.restoreAllMocks();
});

describe('supabase config guards', () => {
  it('disables Supabase when env is placeholder or missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your_supabase_anon_key';

    const mod = await importSupabaseModule();

    expect(mod.isSupabaseEnabled).toBe(false);
    expect(mod.supabase).toBeNull();
    expect(mod.supabaseDisabledReason).toContain('placeholder');
  });

  it('creates a client when env looks valid', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project-ref.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const mod = await importSupabaseModule();

    expect(mod.isSupabaseEnabled).toBe(true);
    expect(mod.supabase).not.toBeNull();
    expect(typeof mod.supabase?.from).toBe('function');
  });
});

describe('sheets server fallbacks', () => {
  it('returns empty fallback data and logs the disabled config once', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your_supabase_anon_key';

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getFestivalSets, getSheets } = await importSheetsServerModule();

    await expect(getSheets(['list', 'genres', 'artists'])).resolves.toMatchObject({
      data: {
        artists: [],
        genres: [],
        list: [],
      },
      ok: true,
    });
    await expect(getFestivalSets()).resolves.toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('Supabase data fetches disabled');
  });
});
