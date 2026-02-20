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
import { MAP_VISUAL_VARIANTS } from '@/components/home/mapVisualVariants';
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
    <main className="relative w-full px-2 py-2 sm:px-4 sm:py-4">
      <section className="space-y-6 pb-28 sm:space-y-8 sm:pb-32">
        {MAP_VISUAL_VARIANTS.map(variant => (
          <article key={variant.id} className="space-y-2 sm:space-y-3">
            <header className="px-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-700 sm:text-base">
                {variant.title}
              </h2>
              <p className="text-xs text-neutral-600 sm:text-sm">{variant.subtitle}</p>
            </header>
            <div className="h-[19rem] sm:h-[24rem] lg:h-[28rem]">
              <AmsterdamMapStage
                zones={MAP_ZONES}
                activeZoneId={selectedZoneId}
                hoveredZoneId={hoveredZoneId}
                onSelect={handleSelectZone}
                onHover={setHoveredZoneId}
                onClearSelection={handleClearSelection}
                variant={variant.id}
              />
            </div>
          </article>
        ))}
      </section>
      {selectedZone ? (
        <div
          className={[
            'pointer-events-none fixed inset-x-4 bottom-4 z-30 sm:inset-x-auto sm:bottom-8 sm:w-[22rem]',
            selectedZone.anchorDesktop.x >= 50
              ? 'sm:left-8 sm:right-auto'
              : 'sm:right-8 sm:left-auto',
          ].join(' ')}
        >
          <div className="pointer-events-auto">
            <ActiveSetCard
              zone={selectedZone}
              row={selectedRow}
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
