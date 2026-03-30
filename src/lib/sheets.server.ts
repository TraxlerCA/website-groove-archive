import 'server-only';
import { cache } from 'react';
import {
  isSupabaseEnabled,
  supabase,
  supabaseDisabledReason,
} from '@/lib/supabase';
import type { Artist, Genre, Row } from '@/lib/types';

// Re-export types for compatibility
export type { Artist, Genre, Row };

const SHEET_TABS = ['list', 'genres', 'artists'] as const;

export type SheetTab = (typeof SHEET_TABS)[number];
export type SheetsData = { list?: Row[]; genres?: Genre[]; artists?: Artist[] } & Record<string, unknown>;
export type SheetsUnavailableCode = 'supabase_disabled' | 'query_failed';
export type SheetsUnavailablePayload = {
  ok: false;
  updatedAt: string;
  error: {
    code: SheetsUnavailableCode;
    message: string;
    failedTab: SheetTab;
  };
};
export type SheetsSuccessPayload = { ok: true; updatedAt: string; data: SheetsData };
export type SheetsPayload = SheetsSuccessPayload | SheetsUnavailablePayload;

type LoadSuccess<T> = { ok: true; data: T };
type LoadFailure = {
  ok: false;
  code: SheetsUnavailableCode;
  message: string;
  failedTab: SheetTab;
};
type LoadResult<T> = LoadSuccess<T> | LoadFailure;

type RawGenre = { label: string; explanation: string };
type RawArtist = { artist: string; rating: Artist['rating'] };
type RawSetRow = {
  title: string;
  rating: string | null;
  soundcloud_url: string | null;
  youtube_url: string | null;
  genres: Array<{ label: string }> | { label: string } | null;
};

let hasLoggedDisabledSupabase = false;

function logSupabaseDisabledOnce() {
  if (hasLoggedDisabledSupabase) return;

  hasLoggedDisabledSupabase = true;
  console.warn(
    `Supabase data fetches disabled: ${supabaseDisabledReason ?? 'configuration unavailable'}.`,
  );
}

function shouldSkipSupabaseFetches() {
  if (isSupabaseEnabled && supabase) {
    return false;
  }

  logSupabaseDisabledOnce();
  return true;
}

function normalizeRequestedTabs(tabs?: string[]): SheetTab[] {
  const requested = tabs && tabs.length ? tabs : [...SHEET_TABS];

  return requested.filter((tab): tab is SheetTab =>
    SHEET_TABS.includes(tab as SheetTab),
  );
}

function createUnavailableResult(
  failedTab: SheetTab,
  code: SheetsUnavailableCode,
): LoadFailure {
  const message =
    code === 'supabase_disabled'
      ? 'Archive data is temporarily unavailable.'
      : 'Archive data could not be loaded.';

  return {
    ok: false,
    code,
    message,
    failedTab,
  };
}

function getSheetsClientOrFailure(
  failedTab: SheetTab,
): LoadSuccess<NonNullable<typeof supabase>> | LoadFailure {
  if (shouldSkipSupabaseFetches()) {
    return createUnavailableResult(failedTab, 'supabase_disabled');
  }

  if (!supabase) {
    logSupabaseDisabledOnce();
    return createUnavailableResult(failedTab, 'supabase_disabled');
  }

  return { ok: true, data: supabase };
}

async function loadGenresForSheets(): Promise<LoadResult<Genre[]>> {
  const clientResult = getSheetsClientOrFailure('genres');
  if (!clientResult.ok) {
    return clientResult;
  }

  const { data, error } = await clientResult.data
    .from('genres')
    .select('label, explanation');

  if (error) {
    console.error('Error fetching genres:', error);
    return createUnavailableResult('genres', 'query_failed');
  }

  return { ok: true, data: (data ?? []) as RawGenre[] };
}

async function loadArtistsForSheets(): Promise<LoadResult<Artist[]>> {
  const clientResult = getSheetsClientOrFailure('artists');
  if (!clientResult.ok) {
    return clientResult;
  }

  const { data, error } = await clientResult.data
    .from('artists')
    .select('artist, rating');

  if (error) {
    console.error('Error fetching artists:', JSON.stringify(error, null, 2));
    return createUnavailableResult('artists', 'query_failed');
  }

  return {
    ok: true,
    data: ((data ?? []) as RawArtist[]).map((artist) => ({
      name: artist.artist,
      rating: artist.rating,
    })),
  };
}

async function loadListRowsForSheets(): Promise<LoadResult<Row[]>> {
  const clientResult = getSheetsClientOrFailure('list');
  if (!clientResult.ok) {
    return clientResult;
  }

  const { data, error } = await clientResult.data
    .from('sets')
    .select(`
      title,
      rating,
      soundcloud_url,
      youtube_url,
      genres ( label )
    `);

  if (error) {
    console.error('Error fetching sets:', error);
    return createUnavailableResult('list', 'query_failed');
  }

  return {
    ok: true,
    data: ((data ?? []) as RawSetRow[]).map((row) => {
      const genre = Array.isArray(row.genres) ? row.genres[0] : row.genres;

      return {
        set: row.title,
        classification: genre?.label ?? null,
        soundcloud: row.soundcloud_url,
        youtube: row.youtube_url,
        tier: row.rating,
      };
    }),
  };
}

export const getGenres = cache(async (): Promise<Genre[]> => {
  const result = await loadGenresForSheets();
  return result.ok ? result.data : [];
});

export const getArtists = cache(async (): Promise<Artist[]> => {
  const result = await loadArtistsForSheets();
  return result.ok ? result.data : [];
});

export const getListRows = cache(async (): Promise<Row[]> => {
  const result = await loadListRowsForSheets();
  return result.ok ? result.data : [];
});

// New function for heatmaps
// No functional changes needed here as it returns raw data, but keeping it consistent with hook's intent
export const getFestivalSets = cache(async () => {
  if (shouldSkipSupabaseFetches()) {
    return [];
  }

  const client = supabase;
  if (!client) {
    return [];
  }

  const candidateTables = ['festival_sets', 'heatmaps'];

  for (const table of candidateTables) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('date', { ascending: false });

    if (!error) {
      return data || [];
    }

    console.warn(`Failed fetching festival data from ${table}:`, error.message);
  }

  console.error('Error fetching festival sets: could not load from festival_sets or heatmaps');
  return [];
});

export const getSheets = cache(async (tabs?: string[]): Promise<SheetsPayload> => {
  const wanted = normalizeRequestedTabs(tabs);
  const data: SheetsData = {};
  const updatedAt = new Date().toISOString();

  for (const tab of wanted) {
    if (tab === 'list') {
      const result = await loadListRowsForSheets();
      if (!result.ok) {
        return {
          ok: false,
          updatedAt,
          error: {
            code: result.code,
            message: result.message,
            failedTab: result.failedTab,
          },
        };
      }

      data.list = result.data;
      continue;
    }

    if (tab === 'genres') {
      const result = await loadGenresForSheets();
      if (!result.ok) {
        return {
          ok: false,
          updatedAt,
          error: {
            code: result.code,
            message: result.message,
            failedTab: result.failedTab,
          },
        };
      }

      data.genres = result.data;
      continue;
    }

    const result = await loadArtistsForSheets();
    if (!result.ok) {
      return {
        ok: false,
        updatedAt,
        error: {
          code: result.code,
          message: result.message,
          failedTab: result.failedTab,
        },
      };
    }

    data.artists = result.data;
  }

  return {
    ok: true,
    updatedAt,
    data,
  };
});
