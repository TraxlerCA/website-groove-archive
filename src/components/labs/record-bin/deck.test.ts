import { describe, expect, it } from 'vitest';
import {
  ALL_GENRE_LABEL,
  UNCLASSIFIED_GENRE_LABEL,
  buildGenreOptions,
  buildRecordBinDeck,
  filterRecordBinDeck,
  resolveRecordBinMediaTargets,
  shuffleRecordBinDeck,
} from '@/components/record-bin/deck';
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
  it('includes every eligible archive row and keeps provider-specific outbound urls', () => {
    const deck = buildRecordBinDeck(rows, { rng: () => 0.999999 });

    expect(deck).toHaveLength(3);
    expect(deck.map((item) => item.title)).toEqual([
      'Delta Funktion at Fold',
      'Call Super in Amsterdam',
      'Batu in Bristol',
    ]);
    expect(deck[0].primaryOpenUrl).toContain('soundcloud.com');
    expect(deck[0].soundcloudUrl).toContain('soundcloud.com');
    expect(deck[0].youtubeUrl).toBeNull();
    expect(deck[1].primaryOpenUrl).toContain('youtube.com');
    expect(deck[1].soundcloudUrl).toBeNull();
    expect(deck[1].youtubeUrl).toContain('youtube.com');
  });

});

describe('resolveRecordBinMediaTargets', () => {
  it('prefers SoundCloud for the primary artwork destination', () => {
    expect(
      resolveRecordBinMediaTargets({
        soundcloud: 'https://soundcloud.com/archive/sunrise-set',
        youtube: 'https://www.youtube.com/watch?v=sunrise-set',
      }),
    ).toEqual({
      primaryOpenUrl: 'https://soundcloud.com/archive/sunrise-set',
      soundcloudUrl: 'https://soundcloud.com/archive/sunrise-set',
      youtubeUrl: 'https://www.youtube.com/watch?v=sunrise-set',
    });
  });

  it('falls back to YouTube when SoundCloud is missing or invalid', () => {
    expect(
      resolveRecordBinMediaTargets({
        soundcloud: 'javascript:alert(1)',
        youtube: 'https://www.youtube.com/watch?v=backup-set',
      }),
    ).toEqual({
      primaryOpenUrl: 'https://www.youtube.com/watch?v=backup-set',
      soundcloudUrl: null,
      youtubeUrl: 'https://www.youtube.com/watch?v=backup-set',
    });
  });

  it('returns null targets when neither provider link is usable', () => {
    expect(
      resolveRecordBinMediaTargets({
        soundcloud: 'ftp://soundcloud.com/archive/bad-set',
        youtube: 'javascript:alert(1)',
      }),
    ).toEqual({
      primaryOpenUrl: null,
      soundcloudUrl: null,
      youtubeUrl: null,
    });
  });
});

describe('genre helpers', () => {
  const deck = buildRecordBinDeck(rows, { rng: () => 0.999999 });

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
