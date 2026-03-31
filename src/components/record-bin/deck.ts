import { sanitizeMediaUrl, sanitizePrimaryMediaUrl } from '@/lib/sanitize';
import type { Row } from '@/lib/types';

export const ALL_GENRE_LABEL = 'All';
export const UNCLASSIFIED_GENRE_LABEL = 'Unclassified';

export type RecordBinDeckItem = {
  id: string;
  title: string;
  classification: string | null;
  primaryMediaUrl: string;
  soundcloudUrl: string | null;
};

type RandomFn = () => number;

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function createSeededRandom(seedValue: string): RandomFn {
  let seed = hashString(seedValue) || 1;

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function normalizeClassification(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

function createRecordBinDeckItem(row: Row): RecordBinDeckItem | null {
  const title = row.set.trim();
  if (!title) return null;

  const primaryMediaUrl = sanitizePrimaryMediaUrl(row);
  if (!primaryMediaUrl) return null;

  const soundcloudUrl = sanitizeMediaUrl(row.soundcloud);

  return {
    id: `${title.toLowerCase()}|${primaryMediaUrl}`,
    title,
    classification: normalizeClassification(row.classification),
    primaryMediaUrl,
    soundcloudUrl,
  };
}

export function shuffleRecordBinDeck<T>(items: T[], rng: RandomFn = Math.random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }

  return shuffled;
}

export function buildRecordBinDeck(rows: Row[], rng?: RandomFn) {
  const deck = rows
    .map(createRecordBinDeckItem)
    .filter((item): item is RecordBinDeckItem => Boolean(item));

  const seededRng =
    rng ??
    createSeededRandom(
      deck
        .map((item) => item.id)
        .join('|'),
    );

  return shuffleRecordBinDeck(deck, seededRng);
}

export function buildGenreOptions(items: RecordBinDeckItem[]) {
  const seen = new Set<string>();
  const options = [ALL_GENRE_LABEL];
  let hasUnclassified = false;

  items.forEach((item) => {
    if (!item.classification) {
      hasUnclassified = true;
      return;
    }

    const key = item.classification.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    options.push(item.classification);
  });

  const sortedGenres = options
    .slice(1)
    .sort((left, right) => left.localeCompare(right));

  if (hasUnclassified) {
    sortedGenres.push(UNCLASSIFIED_GENRE_LABEL);
  }

  return [ALL_GENRE_LABEL, ...sortedGenres];
}

export function filterRecordBinDeck(items: RecordBinDeckItem[], genre: string) {
  if (genre === ALL_GENRE_LABEL) return items;
  if (genre === UNCLASSIFIED_GENRE_LABEL) {
    return items.filter((item) => item.classification === null);
  }

  return items.filter((item) => item.classification === genre);
}
