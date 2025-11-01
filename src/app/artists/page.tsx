import { getArtists } from '@/lib/sheets.server';
import type { Artist } from '@/lib/types';
import ArtistsPageClient from './ArtistsPageClient';

export const revalidate = 300;

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function ArtistsPage() {
  const artists = await getArtists();

  const grouped: Record<Artist['rating'], Artist[]> = {
    blazing: [],
    hot: [],
    ok: [],
  };

  for (const artist of artists) {
    if (grouped[artist.rating]) grouped[artist.rating].push(artist);
  }

  const shuffled = {
    blazing: shuffle(grouped.blazing),
    hot: shuffle(grouped.hot),
    ok: shuffle(grouped.ok),
  } as Record<Artist['rating'], Artist[]>;

  return <ArtistsPageClient artistsByRating={shuffled} />;
}
