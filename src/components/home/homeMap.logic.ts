import type { Row } from '@/lib/types';
import { sanitizeMediaUrl } from '@/lib/sanitize';
import {
  CORE_ZONE_GENRE_LABELS,
  MAP_ZONES,
  WILDCARD_ZONE_ID,
  type MapZoneConfig,
} from '@/components/home/mapZones';

export function normalizeLabel(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function getSoundcloudEligibleRows(rows: Row[]): Row[] {
  return rows.filter(row => Boolean(sanitizeMediaUrl(row.soundcloud)));
}

export function getRowsForZone(
  rows: Row[],
  zone: MapZoneConfig,
  zones: MapZoneConfig[] = MAP_ZONES,
): Row[] {
  if (zone.id !== WILDCARD_ZONE_ID) {
    const target = normalizeLabel(zone.genreLabel);
    return rows.filter(row => normalizeLabel(row.classification) === target);
  }

  const explicitCoreGenres = zones
    .filter(item => item.id !== WILDCARD_ZONE_ID)
    .map(item => normalizeLabel(item.genreLabel))
    .filter(Boolean);
  const fallbackCoreGenres = CORE_ZONE_GENRE_LABELS.map(normalizeLabel);
  const coreGenres = new Set(
    explicitCoreGenres.length > 0 ? explicitCoreGenres : fallbackCoreGenres,
  );

  const leftfieldRows = rows.filter(row => {
    const classification = normalizeLabel(row.classification);
    if (!classification) return true;
    return !coreGenres.has(classification);
  });

  if (leftfieldRows.length > 0) return leftfieldRows;
  return rows;
}

export function pickRandomRow(pool: Row[], previousSet: string | null | undefined): Row | null {
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];

  const previous = (previousSet || '').trim();
  const candidates = previous
    ? pool.filter(row => row.set.trim() !== previous)
    : pool;
  const usable = candidates.length > 0 ? candidates : pool;
  const index = Math.floor(Math.random() * usable.length);
  return usable[index];
}

