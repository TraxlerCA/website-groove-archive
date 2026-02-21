import { describe, expect, it } from 'vitest';
import {
  MAP_ZONES,
  WILDCARD_ZONE_ID,
  getZoneMarkerGlyph,
  type MapZoneConfig,
} from '@/components/home/mapZones';

function buildZone(overrides: Partial<MapZoneConfig>): MapZoneConfig {
  return {
    id: 'canal_glow',
    displayName: 'Default Display',
    genreLabel: 'Default Genre',
    accent: '#000000',
    areas: [],
    anchorDesktop: { x: 0, y: 0, align: 'center' },
    anchorMobile: { x: 0, y: 0, align: 'center' },
    ...overrides,
  };
}

describe('getZoneMarkerGlyph', () => {
  it('returns ? for wildcard zone', () => {
    const wildcard = MAP_ZONES.find(zone => zone.id === WILDCARD_ZONE_ID);
    if (!wildcard) throw new Error('missing wildcard zone');
    expect(getZoneMarkerGlyph(wildcard)).toBe('?');
  });

  it('returns uppercase first alphabetical character for standard zones', () => {
    const canalGlow = MAP_ZONES.find(zone => zone.id === 'canal_glow');
    if (!canalGlow) throw new Error('missing canal_glow zone');
    expect(getZoneMarkerGlyph(canalGlow)).toBe('M');
  });

  it('handles leading spaces and symbols in genre labels', () => {
    const zone = buildZone({
      genreLabel: '   123 - deep house',
      displayName: 'Should Not Be Used',
    });
    expect(getZoneMarkerGlyph(zone)).toBe('D');
  });

  it('falls back to display name when genre label has no letters', () => {
    const zone = buildZone({
      genreLabel: ' 1234 !!!',
      displayName: '  _party remixes',
    });
    expect(getZoneMarkerGlyph(zone)).toBe('P');
  });

  it('falls back to bullet when no alphabetical characters exist', () => {
    const zone = buildZone({
      genreLabel: '1234 !!!',
      displayName: '---',
    });
    expect(getZoneMarkerGlyph(zone)).toBe('•');
  });
});
