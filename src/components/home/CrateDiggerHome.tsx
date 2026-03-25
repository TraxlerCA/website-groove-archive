'use client';

import { useMemo, useState } from 'react';
import CrateStack from '@/components/home/CrateStack';
import { getSoundcloudEligibleRows, normalizeLabel } from '@/components/home/homeMap.logic';
import { usePlayerActions } from '@/context/PlayerProvider';
import { useSiteData } from '@/context/SiteDataContext';
import { stableHash, trackEvent } from '@/lib/analytics';

export default function CrateDiggerHome() {
  const siteData = useSiteData();
  const { play } = usePlayerActions();
  const rows = useMemo(() => getSoundcloudEligibleRows(siteData.rows), [siteData.rows]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [genreFilter, setGenreFilter] = useState('all');

  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(row => {
      const value = (row.classification || '').trim();
      if (value) set.add(value);
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (genreFilter === 'all') return rows;
    const target = normalizeLabel(genreFilter);
    return rows.filter(row => normalizeLabel(row.classification) === target);
  }, [genreFilter, rows]);

  const [prevFilteredCount, setPrevFilteredCount] = useState(filteredRows.length);

  if (filteredRows.length !== prevFilteredCount) {
    setActiveIndex(0);
    setPrevFilteredCount(filteredRows.length);
  }

  return (
    <main className="container mx-auto max-w-6xl px-6 pt-7 pb-12 sm:pt-12">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/35 bg-[radial-gradient(circle_at_15%_12%,rgba(76,198,255,0.2),transparent_42%),radial-gradient(circle_at_82%_14%,rgba(255,151,86,0.2),transparent_40%),linear-gradient(170deg,#f8fbff_0%,#ecf1f9_100%)] px-6 py-8 shadow-[0_28px_70px_rgba(15,23,42,0.14)] sm:px-9 sm:py-10">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Crate Digger mode
            <span className="h-px w-10 bg-neutral-300" />
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.015em] text-neutral-900 sm:text-5xl sm:leading-[1.04]">
            Flip sleeves until one feels right. Press play and keep moving.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            A tactile crate stack for fast discovery. No noise, no overthinking.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="crate-genre"
              className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-neutral-500"
            >
              Genre filter
            </label>
            <select
              id="crate-genre"
              value={genreFilter}
              onChange={event => setGenreFilter(event.target.value)}
              className="rounded-full border border-neutral-300 bg-white/90 px-4 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/65"
            >
              {genreOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All genres' : option}
                </option>
              ))}
            </select>
          </div>

          <CrateStack
            rows={filteredRows}
            activeIndex={activeIndex}
            onChangeActiveIndex={setActiveIndex}
            onPlay={row => {
              play(row, 'soundcloud');
              trackEvent('home_crate_play_clicked', {
                set_hash: stableHash(row.set),
                genre: row.classification || 'unknown',
              });
            }}
            onOutboundClick={(href, row) => {
              trackEvent('home_crate_outbound_clicked', {
                set_hash: stableHash(row.set),
                domain: new URL(href).hostname,
              });
            }}
          />
        </div>
      </section>
    </main>
  );
}

