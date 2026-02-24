import { describe, expect, it } from 'vitest';
import {
  CORE_ZONE_GENRE_LABELS,
  MAP_ZONES,
  WILDCARD_ZONE_ID,
  getContrastTextColor,
  normalizeMapZoneId,
} from '@/components/home/mapZones';

describe('mapZones config', () => {
  it('has unique zone ids', () => {
    const ids = MAP_ZONES.map(zone => zone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains the wildcard zone exactly once', () => {
    expect(MAP_ZONES.filter(zone => zone.id === WILDCARD_ZONE_ID)).toHaveLength(1);
  });

  it('maps core labels to all non-wildcard zones', () => {
    expect(CORE_ZONE_GENRE_LABELS).toHaveLength(MAP_ZONES.length - 1);
  });
});

describe('getContrastTextColor', () => {
  it('returns light text for dark colors', () => {
    expect(getContrastTextColor('#111827')).toBe('#F8FAFC');
  });

  it('returns dark text for light colors', () => {
    expect(getContrastTextColor('#f8fafc')).toBe('#030712');
  });

  it('falls back to dark text for invalid hex values', () => {
    expect(getContrastTextColor('not-a-color')).toBe('#030712');
  });
});

describe('normalizeMapZoneId', () => {
  it('keeps canonical ids unchanged', () => {
    expect(normalizeMapZoneId('melodic_house_techno')).toBe('melodic_house_techno');
  });

  it('maps legacy ids to canonical ids', () => {
    expect(normalizeMapZoneId('canal_glow')).toBe('melodic_house_techno');
  });

  it('returns null for unknown ids', () => {
    expect(normalizeMapZoneId('unknown_zone')).toBeNull();
  });
});
