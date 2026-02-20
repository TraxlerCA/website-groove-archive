'use client';

import { useCallback, useMemo, useState } from 'react';
import ActiveSetCard from '@/components/home/ActiveSetCard';
import AmsterdamMapStage from '@/components/home/AmsterdamMapStage';
import {
  getRowsForZone,
  getSoundcloudEligibleRows,
  normalizeLabel,
} from '@/components/home/homeMap.logic';
import {
  HomeEventName,
  MAP_ZONES,
  type MapZoneId,
} from '@/components/home/mapZones';
import { usePlayerActions } from '@/context/PlayerProvider';
import { useSiteData } from '@/context/SiteDataContext';
import { stableHash, trackEvent } from '@/lib/analytics';

export default function AmsterdamMapHome() {
  const siteData = useSiteData();
  const { play } = usePlayerActions();
  const [selectedZoneId, setSelectedZoneId] = useState<MapZoneId | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<MapZoneId | null>(null);

  const zonesById = useMemo(
    () =>
      MAP_ZONES.reduce<Record<MapZoneId, (typeof MAP_ZONES)[number]>>((acc, zone) => {
        acc[zone.id] = zone;
        return acc;
      }, {} as Record<MapZoneId, (typeof MAP_ZONES)[number]>),
    [],
  );

  const rows = useMemo(() => getSoundcloudEligibleRows(siteData.rows), [siteData.rows]);
  const activeZoneId = hoveredZoneId || selectedZoneId;
  const activeZone = activeZoneId ? zonesById[activeZoneId] : null;

  const activeRow = useMemo(() => {
    if (!activeZone) return null;
    const pool = getRowsForZone(rows, activeZone, MAP_ZONES);
    if (pool.length === 0) return null;
    const sorted = [...pool].sort((a, b) => a.set.localeCompare(b.set));
    const seed = parseInt(stableHash(activeZone.id), 16) || 0;
    return sorted[seed % sorted.length];
  }, [activeZone, rows]);

  const genreDescription = useMemo(() => {
    if (!activeZone) return undefined;
    const target = normalizeLabel(activeZone.genreLabel);
    return siteData.genres.find(genre => normalizeLabel(genre.label) === target)?.explanation;
  }, [activeZone, siteData.genres]);

  const handleSelectZone = useCallback((zoneId: MapZoneId) => {
    const zone = MAP_ZONES.find(entry => entry.id === zoneId);
    if (!zone) return;

    setSelectedZoneId(zoneId);
    trackEvent(HomeEventName.ZoneSelected, {
      zone_id: zone.id,
      genre: zone.genreLabel,
    });
  }, []);

  const handlePlay = useCallback(() => {
    if (!activeRow || !activeZone) return;
    play(activeRow, 'soundcloud');
    trackEvent(HomeEventName.PlayClicked, {
      zone_id: activeZone.id,
      set_hash: stableHash(activeRow.set),
      genre: activeZone.genreLabel,
    });
  }, [activeRow, activeZone, play]);

  const handleOutboundClick = useCallback(
    (href: string) => {
      if (!activeRow || !activeZone) return;
      let domain = 'unknown';
      try {
        domain = new URL(href).hostname;
      } catch {
        // no-op
      }
      trackEvent(HomeEventName.OutboundClicked, {
        zone_id: activeZone.id,
        set_hash: stableHash(activeRow.set),
        domain,
      });
    },
    [activeRow, activeZone],
  );

  return (
    <main className="relative h-[calc(100svh-9.5rem)] w-full px-2 py-2 sm:h-[calc(100svh-10.5rem)] sm:px-4 sm:py-4">
      <AmsterdamMapStage
        zones={MAP_ZONES}
        activeZoneId={activeZoneId}
        onSelect={handleSelectZone}
        onHover={setHoveredZoneId}
      />
      {activeZone ? (
        <div
          className={[
            'pointer-events-none absolute inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-8 sm:w-[22rem]',
            activeZone.anchorDesktop.x >= 50
              ? 'sm:left-8 sm:right-auto'
              : 'sm:right-8 sm:left-auto',
          ].join(' ')}
        >
          <div className="pointer-events-auto">
            <ActiveSetCard
              zone={activeZone}
              row={activeRow}
              genreDescription={genreDescription}
              onPlay={handlePlay}
              onOutboundClick={handleOutboundClick}
              compact
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
