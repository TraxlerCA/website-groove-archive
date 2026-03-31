import { describe, expect, it } from 'vitest';
import {
  ALL_GENRE_LABEL,
  UNCLASSIFIED_GENRE_LABEL,
  buildGenreOptions,
  buildRecordBinDeck,
  filterRecordBinDeck,
  shuffleRecordBinDeck,
} from './deck';
import type { Row } from '@/lib/types';

const rows: Row[] = [
  {
    set: 'Delta Funktion at Fold',
    classification: 'Techno',
    soundcloud: 'https://soundcloud.com/archive/delta-funktion-fold',
    youtube: null,
  },
  {
    set: 'Call Super in Amsterdam',
    classification: 'House',
    soundcloud: null,
    youtube: 'https://www.youtube.com/watch?v=call-super-amsterdam',
  },
  {
    set: 'Batu in Bristol',
    classification: null,
    soundcloud: 'https://soundcloud.com/archive/batu-in-bristol',
    youtube: null,
  },
  {
    set: 'Invalid Entry',
    classification: 'Techno',
    soundcloud: 'http://soundcloud.com/archive/not-safe',
    youtube: null,
  },
];

describe('shuffleRecordBinDeck', () => {
  it('uses the injected rng for deterministic shuffling', () => {
    const shuffled = shuffleRecordBinDeck(['A', 'B', 'C', 'D'], () => 0);

    expect(shuffled).toEqual(['B', 'C', 'D', 'A']);
  });
});

describe('buildRecordBinDeck', () => {
  it('includes every eligible archive row and keeps non-soundcloud media', () => {
    const deck = buildRecordBinDeck(rows, () => 0.999999);

    expect(deck).toHaveLength(3);
    expect(deck.map((item) => item.title)).toEqual([
      'Delta Funktion at Fold',
      'Call Super in Amsterdam',
      'Batu in Bristol',
    ]);
    expect(deck[1].primaryMediaUrl).toContain('youtube.com');
    expect(deck[1].soundcloudUrl).toBeNull();
  });
});

describe('genre helpers', () => {
  const deck = buildRecordBinDeck(rows, () => 0.999999);

  it('builds one sorted option list with unclassified at the end', () => {
    expect(buildGenreOptions(deck)).toEqual([
      ALL_GENRE_LABEL,
      'House',
      'Techno',
      UNCLASSIFIED_GENRE_LABEL,
    ]);
  });

  it('filters while preserving the existing deck order', () => {
    expect(filterRecordBinDeck(deck, ALL_GENRE_LABEL).map((item) => item.title)).toEqual([
      'Delta Funktion at Fold',
      'Call Super in Amsterdam',
      'Batu in Bristol',
    ]);

    expect(filterRecordBinDeck(deck, 'Techno').map((item) => item.title)).toEqual([
      'Delta Funktion at Fold',
    ]);

    expect(filterRecordBinDeck(deck, UNCLASSIFIED_GENRE_LABEL).map((item) => item.title)).toEqual([
      'Batu in Bristol',
    ]);
  });
});
