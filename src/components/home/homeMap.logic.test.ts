import { describe, expect, it, vi, afterEach } from 'vitest';
import { getRowsForZone, getSoundcloudEligibleRows, pickRandomRow } from '@/components/home/homeMap.logic';
import { MAP_ZONES, WILDCARD_ZONE_ID } from '@/components/home/mapZones';
import type { Row } from '@/lib/types';

const baseRows: Row[] = [
  {
    set: 'Melodic Night',
    classification: 'Melodic House & Techno',
    soundcloud: 'https://soundcloud.com/artist/melodic-night',
  },
  {
    set: 'Garage Rollers',
    classification: 'Classic House & Garage',
    soundcloud: 'https://soundcloud.com/artist/garage-rollers',
  },
  {
    set: 'Experimental Ferry',
    classification: 'Ambient Leftfield',
    soundcloud: 'https://soundcloud.com/artist/ambient-leftfield',
  },
  {
    set: 'Unsafe Link',
    classification: 'Melodic House & Techno',
    soundcloud: 'http://malicious.example.com/not-allowed',
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('homeMap.logic', () => {
  it('returns only valid SoundCloud rows for zone filtering', () => {
    const eligible = getSoundcloudEligibleRows(baseRows);
    const zone = MAP_ZONES.find(item => item.id === 'melodic_house_techno');
    if (!zone) throw new Error('missing zone');

    const pool = getRowsForZone(eligible, zone, MAP_ZONES);
    expect(pool).toHaveLength(1);
    expect(pool[0].set).toBe('Melodic Night');
    expect(pool.every(row => row.soundcloud?.startsWith('https://soundcloud.com/'))).toBe(true);
  });

  it('uses non-core rows for wildcard zone and falls back to full pool when needed', () => {
    const eligible = getSoundcloudEligibleRows(baseRows);
    const wildcardZone = MAP_ZONES.find(item => item.id === WILDCARD_ZONE_ID);
    if (!wildcardZone) throw new Error('missing wildcard zone');

    const wildcardPool = getRowsForZone(eligible, wildcardZone, MAP_ZONES);
    expect(wildcardPool.map(row => row.set)).toEqual(['Experimental Ferry']);

    const noLeftfieldRows = eligible.filter(row =>
      ['Melodic House & Techno', 'Classic House & Garage'].includes(row.classification || ''),
    );
    const fallbackPool = getRowsForZone(noLeftfieldRows, wildcardZone, MAP_ZONES);
    expect(fallbackPool).toBe(noLeftfieldRows);
    expect(fallbackPool).toHaveLength(2);
  });

  it('avoids immediate repeats when selecting random rows', () => {
    const pool: Row[] = [
      {
        set: 'Set A',
        classification: 'Disco & Funky House',
        soundcloud: 'https://soundcloud.com/artist/set-a',
      },
      {
        set: 'Set B',
        classification: 'Disco & Funky House',
        soundcloud: 'https://soundcloud.com/artist/set-b',
      },
    ];

    vi.spyOn(Math, 'random').mockReturnValue(0);
    const picked = pickRandomRow(pool, 'Set A');
    expect(picked?.set).toBe('Set B');
  });

  it('covers wildcard fallback genres and random selection edge-cases', () => {
    const wildcardZone = MAP_ZONES.find(item => item.id === WILDCARD_ZONE_ID);
    if (!wildcardZone) throw new Error('missing wildcard zone');

    const rows: Row[] = [
      {
        set: 'Core One',
        classification: 'Melodic House & Techno',
        soundcloud: 'https://soundcloud.com/artist/core-one',
      },
      {
        set: 'No Genre',
        classification: null,
        soundcloud: 'https://soundcloud.com/artist/no-genre',
      },
    ];

    const customZones = [wildcardZone];
    const wildcardPool = getRowsForZone(rows, wildcardZone, customZones);
    expect(wildcardPool.map(row => row.set)).toEqual(['No Genre']);

    expect(pickRandomRow([], null)).toBeNull();
    expect(pickRandomRow([rows[0]], rows[0].set)).toEqual(rows[0]);

    vi.spyOn(Math, 'random').mockReturnValue(0);
    const pickedWithoutPrevious = pickRandomRow(rows, '   ');
    expect(pickedWithoutPrevious).toEqual(rows[0]);
  });
});
