import { describe, expect, it, vi, afterEach } from 'vitest';
import { stableHash, trackEvent } from '@/lib/analytics';

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.restoreAllMocks();
});

describe('stableHash', () => {
  it('is deterministic for the same input', () => {
    const value = 'https://soundcloud.com/artist/set-a';
    expect(stableHash(value)).toBe(stableHash(value));
  });

  it('produces different hashes for different inputs', () => {
    expect(stableHash('set-a')).not.toBe(stableHash('set-b'));
  });
});

describe('trackEvent', () => {
  it('sanitizes nullish props before dispatching', () => {
    const plausible = vi.fn();
    const vaTrack = vi.fn();
    (globalThis as { window?: unknown }).window = {
      plausible,
      va: { track: vaTrack },
    };

    trackEvent('home_map_zone_selected', {
      zone_id: 'melodic_house_techno',
      genre: 'Melodic House & Techno',
      nullable: null,
      missing: undefined,
    });

    expect(plausible).toHaveBeenCalledWith('home_map_zone_selected', {
      props: {
        zone_id: 'melodic_house_techno',
        genre: 'Melodic House & Techno',
      },
    });
    expect(vaTrack).toHaveBeenCalledWith('home_map_zone_selected', {
      zone_id: 'melodic_house_techno',
      genre: 'Melodic House & Techno',
    });
  });

  it('does nothing when window is unavailable', () => {
    expect(() => trackEvent('event_without_window')).not.toThrow();
  });
});
