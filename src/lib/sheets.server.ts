import 'server-only';
import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import type { Artist, Genre, Row } from '@/lib/types';

// Re-export types for compatibility
export type { Artist, Genre, Row };

export const getGenres = cache(async (): Promise<Genre[]> => {
  const { data, error } = await supabase
    .from('genres')
    .select('label, explanation');

  if (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
  return data || [];
});

export const getArtists = cache(async (): Promise<Artist[]> => {
  const { data, error } = await supabase
    .from('artists')
    .select('artist, rating');

  if (error) {
    console.error('Error fetching artists:', JSON.stringify(error, null, 2));
    return [];
  }

  return (data || []).map((a: { artist: string; rating: Artist['rating'] }) => ({
    name: a.artist,
    rating: a.rating,
  })) as unknown as Artist[];
});

export const getListRows = cache(async (): Promise<Row[]> => {
  const { data, error } = await supabase
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
    return [];
  }

  // Define a type for the raw Supabase response
  type SetRow = {
    title: string;
    rating: string;
    soundcloud_url: string | null;
    youtube_url: string | null;
    genres: { label: string } | null;
  };

  return (data || []).map((item: unknown) => {
    const row = item as SetRow;
    return {
      set: row.title,
      classification: row.genres?.label ?? null,
      soundcloud: row.soundcloud_url,
      youtube: row.youtube_url,
      tier: row.rating,
    };
  });
});

// New function for heatmaps
export const getFestivalSets = cache(async () => {
  const { data, error } = await supabase
    .from('festival_sets')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching festival sets:', error);
    return [];
  }
  return data || [];
});

// Deprecated/Compatibility exports
// Some components might still call getSheets(['list']) etc.
// We'll map them to the new functions.

export type SheetsData = { list?: Row[]; genres?: Genre[]; artists?: Artist[] } & Record<string, unknown>;
export type SheetsPayload = { ok: true; updatedAt: string; data: SheetsData };

export const getSheets = cache(async (tabs?: string[]): Promise<SheetsPayload> => {
  const wanted = tabs && tabs.length ? tabs : ['list', 'genres', 'artists'];
  const data: SheetsData = {};

  if (wanted.includes('list')) {
    data.list = await getListRows();
  }
  if (wanted.includes('genres')) {
    data.genres = await getGenres();
  }
  if (wanted.includes('artists')) {
    data.artists = await getArtists();
  }

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    data,
  };
});
