'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import ActiveSetCard from '@/components/home/ActiveSetCard';
import AmsterdamMapStage from '@/components/home/AmsterdamMapStage';
import {
  getRowsForZone,
  pickRandomRow,
  getSoundcloudEligibleRows,
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
  const [selectedRowSet, setSelectedRowSet] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<MapZoneId | null>(null);
  const lastSetByZoneRef = useRef<Partial<Record<MapZoneId, string>>>({});

  const zonesById = useMemo(
    () =>
      MAP_ZONES.reduce<Record<MapZoneId, (typeof MAP_ZONES)[number]>>((acc, zone) => {
        acc[zone.id] = zone;
        return acc;
      }, {} as Record<MapZoneId, (typeof MAP_ZONES)[number]>),
    [],
  );

  const rows = useMemo(() => getSoundcloudEligibleRows(siteData.rows), [siteData.rows]);
  const selectedZone = selectedZoneId ? zonesById[selectedZoneId] : null;

  const selectedRow = useMemo(() => {
    if (!selectedRowSet) return null;
    return rows.find(row => row.set === selectedRowSet) || null;
  }, [rows, selectedRowSet]);

  const handleSelectZone = useCallback((zoneId: MapZoneId) => {
    const zone = zonesById[zoneId];
    if (!zone) return;

    const pool = getRowsForZone(rows, zone, MAP_ZONES);
    const previousSet = lastSetByZoneRef.current[zoneId] || null;
    const nextRow = pickRandomRow(pool, previousSet);

    setSelectedZoneId(zoneId);
    setSelectedRowSet(nextRow?.set || null);
    if (nextRow) {
      lastSetByZoneRef.current[zoneId] = nextRow.set;
    }

    trackEvent(HomeEventName.ZoneSelected, {
      zone_id: zone.id,
      genre: zone.genreLabel,
    });
    if (nextRow) {
      trackEvent(HomeEventName.SetRevealed, {
        zone_id: zone.id,
        set_hash: stableHash(nextRow.set),
        genre: zone.genreLabel,
      });
    }
  }, [rows, zonesById]);

  const handleClearSelection = useCallback(() => {
    setSelectedZoneId(null);
    setSelectedRowSet(null);
    setHoveredZoneId(null);
  }, []);

  const handlePlay = useCallback(() => {
    if (!selectedRow || !selectedZone) return;
    play(selectedRow, 'soundcloud');
    trackEvent(HomeEventName.PlayClicked, {
      zone_id: selectedZone.id,
      set_hash: stableHash(selectedRow.set),
      genre: selectedZone.genreLabel,
    });
  }, [selectedRow, selectedZone, play]);

  const handleOutboundClick = useCallback(
    (href: string) => {
      if (!selectedRow || !selectedZone) return;
      let domain = 'unknown';
      try {
        domain = new URL(href).hostname;
      } catch {
        // no-op
      }
      trackEvent(HomeEventName.OutboundClicked, {
        zone_id: selectedZone.id,
        set_hash: stableHash(selectedRow.set),
        domain,
      });
    },
    [selectedRow, selectedZone],
  );

  return (
    <main className="relative h-[calc(100svh-var(--tga-header-height))] min-h-[18rem] w-full px-2 py-2 sm:px-4 sm:py-4">
      <AmsterdamMapStage
        zones={MAP_ZONES}
        activeZoneId={selectedZoneId}
        hoveredZoneId={hoveredZoneId}
        onSelect={handleSelectZone}
        onHover={setHoveredZoneId}
        onClearSelection={handleClearSelection}
      />
      {selectedZone ? (
        <div
          className={[
            'pointer-events-none absolute inset-x-3 top-3 bottom-3 sm:inset-x-auto sm:top-auto sm:bottom-8 sm:w-[22rem]',
            selectedZone.panelSideDesktop === 'right'
              ? 'sm:right-8 sm:left-auto'
              : 'sm:left-8 sm:right-auto',
          ].join(' ')}
        >
          <div className="pointer-events-auto flex h-full items-end sm:block sm:h-auto">
            <div className="h-[52svh] max-h-full w-full min-h-0 sm:h-auto sm:max-h-none">
              <ActiveSetCard
                zone={selectedZone}
                row={selectedRow}
                onPlay={handlePlay}
                onOutboundClick={handleOutboundClick}
                onClose={handleClearSelection}
                className="h-full pb-[max(1rem,env(safe-area-inset-bottom))]"
                compact
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
