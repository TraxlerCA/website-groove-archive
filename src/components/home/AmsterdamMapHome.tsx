'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ActiveSetCard from '@/components/home/ActiveSetCard';
import AmsterdamMapStage from '@/components/home/AmsterdamMapStage';
import { getRowsForZone, getSoundcloudEligibleRows, normalizeLabel, pickRandomRow } from '@/components/home/homeMap.logic';
import {
  HomeEventName,
  MAP_ZONES,
  WILDCARD_ZONE_ID,
  type MapAnchor,
  type MapZoneConfig,
  type MapZoneId,
} from '@/components/home/mapZones';
import { usePlayerActions } from '@/context/PlayerProvider';
import { useSiteData } from '@/context/SiteDataContext';
import { stableHash, trackEvent } from '@/lib/analytics';
import type { Genre, Row } from '@/lib/types';

function buildGenreTips(entries: Genre[]): Record<string, string> {
  return entries.reduce<Record<string, string>>((acc, entry) => {
    const label = normalizeLabel(entry.label);
    const description = (entry.explanation || '').trim();
    if (!label || !description) return acc;
    acc[label] = description;
    return acc;
  }, {});
}

function getAnchorStyle(anchor: MapAnchor): CSSProperties {
  const translateX =
    anchor.align === 'left' ? '0%' : anchor.align === 'right' ? '-100%' : '-50%';
  return {
    left: `${anchor.x}%`,
    top: `${anchor.y}%`,
    transform: `translate(${translateX}, -50%)`,
  };
}

type ZoneHistory = Partial<Record<MapZoneId, string>>;

export default function AmsterdamMapHome() {
  const siteData = useSiteData();
  const { play } = usePlayerActions();
  const [rows, setRows] = useState<Row[]>(() => getSoundcloudEligibleRows(siteData.rows));
  const [genreTips, setGenreTips] = useState<Record<string, string>>(() =>
    buildGenreTips(siteData.genres),
  );
  const [selectedZoneId, setSelectedZoneId] = useState<MapZoneId | null>(null);
  const [activeRow, setActiveRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSetByZoneRef = useRef<ZoneHistory>({});

  useEffect(() => {
    let mounted = true;
    const fallbackRows = getSoundcloudEligibleRows(siteData.rows);
    const fallbackTips = buildGenreTips(siteData.genres);
    setRows(fallbackRows);
    setGenreTips(fallbackTips);

    (async () => {
      try {
        const response = await fetch('/api/sheets?tabs=list,genres', { cache: 'no-store' });
        const payload = await response.json();
        if (!mounted) return;
        const fetchedRows = getSoundcloudEligibleRows((payload?.data?.list || []) as Row[]);
        const fetchedTips = buildGenreTips((payload?.data?.genres || []) as Genre[]);
        if (fetchedRows.length > 0) {
          setRows(fetchedRows);
        }
        if (Object.keys(fetchedTips).length > 0) {
          setGenreTips(fetchedTips);
        }
      } catch {
        // fallback from SiteDataContext already in place
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [siteData.genres, siteData.rows]);

  const activeZone = useMemo<MapZoneConfig | null>(() => {
    if (!selectedZoneId) return null;
    return MAP_ZONES.find(zone => zone.id === selectedZoneId) || null;
  }, [selectedZoneId]);

  const activeGenreDescription = useMemo(() => {
    if (!activeZone) return undefined;
    return genreTips[normalizeLabel(activeZone.genreLabel)];
  }, [activeZone, genreTips]);

  const handleSelectZone = useCallback(
    (zoneId: MapZoneId) => {
      const zone = MAP_ZONES.find(entry => entry.id === zoneId);
      if (!zone) return;
      const pool = getRowsForZone(rows, zone, MAP_ZONES);
      const previous = lastSetByZoneRef.current[zoneId] || null;
      const picked = pickRandomRow(pool, previous);
      const usedWildcardFallback = zone.id === WILDCARD_ZONE_ID && pool === rows;

      setSelectedZoneId(zoneId);
      setActiveRow(picked);

      trackEvent(HomeEventName.ZoneSelected, {
        zone_id: zone.id,
        genre: zone.genreLabel,
        pool_size: pool.length,
        wildcard_fallback: usedWildcardFallback,
      });

      if (picked) {
        lastSetByZoneRef.current[zoneId] = picked.set;
        trackEvent(HomeEventName.SetRevealed, {
          zone_id: zone.id,
          genre: zone.genreLabel,
          set_hash: stableHash(picked.set),
        });
      }
    },
    [rows],
  );

  const handlePlay = useCallback(() => {
    if (!activeRow?.soundcloud || !activeZone) return;
    play(activeRow, 'soundcloud');
    trackEvent(HomeEventName.PlayClicked, {
      zone_id: activeZone.id,
      genre: activeZone.genreLabel,
      set_hash: stableHash(activeRow.set),
    });
  }, [activeRow, activeZone, play]);

  const handleOutboundClick = useCallback(
    (href: string) => {
      if (!activeZone || !activeRow) return;
      trackEvent(HomeEventName.OutboundClicked, {
        zone_id: activeZone.id,
        genre: activeZone.genreLabel,
        set_hash: stableHash(activeRow.set),
        domain: new URL(href).hostname,
      });
    },
    [activeRow, activeZone],
  );

  return (
    <main className="container mx-auto max-w-6xl px-6 pt-7 pb-12 sm:pt-12">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(247,250,255,0.95)_45%,rgba(228,235,247,0.9)_100%)] px-6 py-8 shadow-[0_28px_70px_rgba(15,23,42,0.16)] sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.16),transparent_40%),radial-gradient(circle_at_8%_82%,rgba(251,146,60,0.14),transparent_35%)]" />
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-neutral-500">
              Amsterdam afterhours mode
              <span className="h-px w-12 bg-neutral-300" />
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.015em] text-neutral-900 sm:text-5xl sm:leading-[1.04]">
              Pick a district. Catch one set. Let the night route itself.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
              Each neighborhood maps to a different sound. Tap a zone to reveal one fitting set and press play.
              No clutter, just the next move.
            </p>
          </div>

          <div className="relative">
            <AmsterdamMapStage
              zones={MAP_ZONES}
              activeZoneId={selectedZoneId}
              onSelect={handleSelectZone}
            />

            <div className="pointer-events-none absolute inset-0 hidden md:block">
              <AnimatePresence mode="wait">
                {activeZone ? (
                  <motion.div
                    key={`desktop-${activeZone.id}-${activeRow?.set || 'empty'}`}
                    className="pointer-events-auto absolute w-[min(360px,34vw)]"
                    style={getAnchorStyle(activeZone.anchorDesktop)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ActiveSetCard
                      zone={activeZone}
                      row={activeRow}
                      genreDescription={activeGenreDescription}
                      onPlay={handlePlay}
                      onOutboundClick={handleOutboundClick}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="absolute inset-x-3 bottom-3 z-30 md:hidden">
              <AnimatePresence mode="wait">
                {activeZone ? (
                  <motion.div
                    key={`mobile-${activeZone.id}-${activeRow?.set || 'empty'}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 14 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ActiveSetCard
                      zone={activeZone}
                      row={activeRow}
                      genreDescription={activeGenreDescription}
                      onPlay={handlePlay}
                      onOutboundClick={handleOutboundClick}
                      compact
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <section className="space-y-3">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Zone legend
            </div>
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
              {MAP_ZONES.map(zone => {
                const active = zone.id === selectedZoneId;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleSelectZone(zone.id)}
                    className={[
                      'shrink-0 snap-start rounded-full border px-3 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/65',
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300 bg-white/75 text-neutral-700 hover:border-neutral-500',
                    ].join(' ')}
                    aria-label={`${zone.displayName} maps to ${zone.genreLabel}`}
                  >
                    <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.22em]">{zone.displayName}</span>
                    <span className="block text-[0.68rem]">{zone.genreLabel}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {!selectedZoneId ? (
            <p className="text-sm text-neutral-600">Select any district to reveal a set.</p>
          ) : null}
          {selectedZoneId && !activeRow && !loading ? (
            <p className="text-sm text-neutral-600">No set was found in this zone right now. Try another area.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

