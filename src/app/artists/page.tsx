import { getArtists } from '@/lib/sheets.server';
import type { Artist } from '@/lib/types';
import ArtistsPageClient from './ArtistsPageClient';

export const revalidate = 300;



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

  const sorted = {
    blazing: grouped.blazing.sort((a, b) => a.name.localeCompare(b.name)),
    hot: grouped.hot.sort((a, b) => a.name.localeCompare(b.name)),
    ok: grouped.ok.sort((a, b) => a.name.localeCompare(b.name)),
  } as Record<Artist['rating'], Artist[]>;

  return <ArtistsPageClient artistsByRating={sorted} />;
}
