'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Artist } from '@/lib/types';

type Rating = Artist['rating'];

const ORDER: Rating[] = ['blazing', 'hot', 'ok'];

const TITLE_META: Record<Rating, { label: string }> = {
  blazing: { label: 'BLAZING' },
  hot: { label: 'HOT' },
  ok: { label: 'OK' },
};

type ArtistsPageClientProps = {
  artistsByRating: Record<Rating, Artist[]>;
};

export default function ArtistsPageClient({ artistsByRating }: ArtistsPageClientProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [debugExpanded, setDebugExpanded] = React.useState(false);

  const grouped = React.useMemo(() => {
    const buckets: Record<Rating, Array<{ name: string; display: string }>> = {
      blazing: [],
      hot: [],
      ok: [],
    };
    for (const rating of ORDER) {
      const entries = artistsByRating[rating] ?? [];
      for (const entry of entries) {
        buckets[rating].push({ name: entry.name, display: formatDisplayName(entry.name) });
      }
    }
    return ORDER.map(rating => ({
      rating,
      entries: buckets[rating],
      label: TITLE_META[rating].label,
    }));
  }, [artistsByRating]);

  React.useEffect(() => {
    const counts = Object.fromEntries(
      ORDER.map(rating => [rating, artistsByRating[rating]?.length ?? 0])
    );
    // eslint-disable-next-line no-console
    console.debug('[ArtistsPage] artist counts by rating', counts, {
      prefersReducedMotion,
      debugExpanded,
    });
    for (const rating of ORDER) {
      const names = (artistsByRating[rating] || []).slice(0, 10).map(a => a.name);
      // eslint-disable-next-line no-console
      console.debug(`[ArtistsPage] sample (${rating})`, names);
    }
  }, [artistsByRating, prefersReducedMotion, debugExpanded]);

  const handleSelect = React.useCallback(
    (rating: Rating, name: string) => {
      const params = new URLSearchParams();
      params.set('q', name);
      router.push(`/list?${params.toString()}`);
    },
    [router]
  );

  return (
    <main className="relative min-h-screen overflow-hidden px-5 pb-24 pt-16 text-slate-100 sm:px-10" style={{ background: '#101114' }}>
      <section className="relative mx-auto flex max-w-6xl flex-col gap-16">
        <div className="flex flex-col gap-16">
          {grouped.map(({ rating, entries, label }) =>
            entries.length ? (
              <TierRail
                key={rating}
                debugCount={entries.length}
                debugExpanded={debugExpanded}
                rating={rating}
                label={label}
                prefersReducedMotion={prefersReducedMotion}
                entries={entries}
                onSelect={handleSelect}
              />
            ) : null
          )}
        </div>
      </section>

      <style>{`
        @keyframes marquee-right {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-1 * var(--loop-distance, 50%))); }
        }
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(var(--loop-distance, 50%)); }
        }
        .rail-marquee {
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .rail-track:hover .rail-marquee,
        .rail-track:focus-within .rail-marquee {
          animation-play-state: paused;
        }
        .rail-track::before,
        .rail-track::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 72px;
          pointer-events: none;
          z-index: 10;
        }
        .rail-track::before {
          left: 0;
          background: linear-gradient(to right, #101114 0%, rgba(16,17,20,0.75) 45%, transparent 100%);
        }
        .rail-track::after {
          right: 0;
          background: linear-gradient(to left, #101114 0%, rgba(16,17,20,0.75) 45%, transparent 100%);
        }
        @media (prefers-reduced-motion: reduce) {
          .rail-marquee { animation: none !important; }
        }
      `}</style>

      <button
        type="button"
        className="fixed bottom-4 right-4 rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg focus:outline-none focus:ring focus:ring-slate-400"
        onClick={() => setDebugExpanded(prev => !prev)}
      >
        {debugExpanded ? 'Collapse Lists' : 'Expand Lists'}
      </button>
    </main>
  );
}

type TierRailProps = {
  debugCount: number;
  debugExpanded: boolean;
  rating: Rating;
  label: string;
  entries: Array<{ name: string; display: string }>;
  prefersReducedMotion: boolean;
  onSelect: (rating: Rating, name: string) => void;
};

function TierRail({
  debugCount,
  debugExpanded,
  rating,
  label,
  entries,
  prefersReducedMotion,
  onSelect,
}: TierRailProps) {
  const marqueeRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [{ marqueeWidth, trackWidth }, setDimensions] = React.useState<{ marqueeWidth: number; trackWidth: number }>({
    marqueeWidth: 0,
    trackWidth: 0,
  });

  const handleMarqueeResize = React.useCallback(({ width }: { width: number }) => {
    setDimensions(prev =>
      width === prev.marqueeWidth ? prev : { ...prev, marqueeWidth: width },
    );
  }, []);

  const handleTrackResize = React.useCallback(({ width }: { width: number }) => {
    setDimensions(prev =>
      width === prev.trackWidth ? prev : { ...prev, trackWidth: width },
    );
  }, []);

  useResizeObserver(marqueeRef, handleMarqueeResize);
  useResizeObserver(trackRef, handleTrackResize);

  // Dynamically calculate repeatCount to ensure seamless looping
  // For small entry sets, we need more repeats to avoid visible resets
  // For large sets, fewer repeats are needed
  const repeatCount = React.useMemo(() => {
    if (entries.length === 0) return 0;
    if (entries.length <= 3) return 6; // Very small sets need many repeats
    if (entries.length <= 10) return 5; // Small sets need more repeats
    return 4; // Larger sets can use fewer repeats
  }, [entries.length]);

  const marquee = React.useMemo(() => {
    if (!entries.length) return [];
    return Array.from({ length: repeatCount }, () => entries).flat();
  }, [entries, repeatCount]);

  // Safeguard: ensure repeatCount is never 0 to avoid division by zero
  const safeRepeatCount = repeatCount || 1;
  const loopFraction = 1 / safeRepeatCount;
  const loopDistance = `${loopFraction * 100}%`;
  const shouldAnimate = !prefersReducedMotion && marquee.length > 0 && !debugExpanded;

  // Calculate duration relative to entry count for consistent visual speed
  // If we have real measurements, base it on pixels travelled; otherwise fall back to entry count
  const baseSpeedPerEntry = 3;
  const TARGET_PX_PER_SEC = 35;
  const MIN_DURATION = 35;
  const MAX_DURATION = 160;

  const fallbackSeconds = Math.max(
    MIN_DURATION,
    Math.min(MAX_DURATION, entries.length * baseSpeedPerEntry)
  );

  const effectiveMarqueeWidth = Math.max(marqueeWidth, trackWidth);
  const measuredDistancePx = shouldAnimate ? effectiveMarqueeWidth * loopFraction : 0;
  const derivedSeconds =
    shouldAnimate && measuredDistancePx > 0
      ? Math.max(
          MIN_DURATION,
          Math.min(MAX_DURATION, measuredDistancePx / TARGET_PX_PER_SEC)
        )
      : fallbackSeconds;

  const duration = `${derivedSeconds}s`;

  const trackClassName = React.useMemo(
    () =>
      [
        'rail-track',
        'relative',
        shouldAnimate
          ? 'overflow-hidden'
          : debugExpanded
            ? 'overflow-visible'
            : 'overflow-x-auto',
        'rounded-[20px]',
        'px-5',
        'py-5',
      ]
        .filter(Boolean)
        .join(' '),
    [shouldAnimate, debugExpanded]
  );

  const displayEntries = shouldAnimate ? marquee : entries;

  return (
    <div
      className="relative flex flex-col gap-3"
      data-debug-rating={rating}
      data-debug-count={debugCount}
    >
      <header className="flex items-center text-[11px] uppercase tracking-[0.42em] text-slate-500/70">
        <span className="inline-flex items-center px-2 py-1 font-semibold text-slate-300">{label}</span>
        <span className="ml-3 text-[10px] font-mono text-slate-500">
          {debugCount} artist{debugCount === 1 ? '' : 's'}
        </span>
        {prefersReducedMotion ? (
          <span className="ml-3 text-[10px] font-semibold text-slate-400">reduced motion</span>
        ) : null}
      </header>

      <div ref={trackRef} className={trackClassName} style={{ background: '#101114' }}>
        <div
          ref={marqueeRef}
          className="rail-marquee flex w-max flex-nowrap items-center gap-12 will-change-transform"
          style={{
            animationDuration: shouldAnimate ? duration : undefined,
            animationName: shouldAnimate ? 'marquee-right' : undefined,
            ['--loop-distance' as const]: shouldAnimate ? loopDistance : undefined,
          }}
        >
          {displayEntries.map((artist, i) => (
            <RailItem key={`${rating}-${artist.display}-${i}`} artist={artist} rating={rating} onSelect={onSelect} />
          ))}
        </div>
      </div>
      {debugExpanded ? (
        <div className="mt-3 rounded-md border border-slate-700/60 bg-slate-800/70 p-3 text-xs text-slate-200">
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {entries.map(artist => (
              <li
                key={`${rating}-debug-${artist.name}`}
                className="font-mono uppercase tracking-wide text-slate-300"
              >
                {artist.name.toUpperCase()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type RailItemProps = {
  artist: { name: string; display: string };
  rating: Rating;
  onSelect: (rating: Rating, name: string) => void;
};

function RailItem({ artist, rating, onSelect }: RailItemProps) {
  return (
    <button
      onClick={() => onSelect(rating, artist.name)}
      className="group relative inline-flex min-w-[18ch] max-w-[22ch] items-center justify-center px-4 text-center text-lg font-semibold tracking-[0.35em] text-slate-300 transition duration-300 hover:text-white sm:text-[1.55rem]"
    >
      <span
        className="relative whitespace-pre-line break-words leading-tight uppercase"
        style={{ hyphens: 'auto' }}
      >
        {artist.display}
      </span>
    </button>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');

    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    update(query);

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }

    // Fallback for Safari < 14
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return prefersReducedMotion;
}

function formatDisplayName(name: string) {
  const words = name
    .split(/\s+/)
    .map(word => word.trim())
    .filter(Boolean)
    .map(word => word.toUpperCase());
  return words.join('\n');
}

type ResizeSize = { width: number; height: number };

function useResizeObserver<T extends Element>(
  ref: React.RefObject<T>,
  onResize: (size: ResizeSize) => void
) {
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    const notify = () => {
      const rect = node.getBoundingClientRect();
      onResize({ width: rect.width, height: rect.height });
    };

    notify();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = entry.contentBoxSize?.[0] ?? entry.contentRect;
        onResize({ width: box.width, height: box.height });
      });
    });

    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref, onResize]);
}
