'use client';

import { useEffect, useMemo, useState } from 'react';
import { GenreTooltip } from '@/components/GenreTooltip';
import { Tag } from '@/components/ui';
import type { MapZoneConfig } from '@/components/home/mapZones';
import type { Row } from '@/lib/types';
import { sanitizeMediaUrl } from '@/lib/sanitize';

type ActiveSetCardProps = {
  zone: MapZoneConfig;
  row: Row | null;
  genreDescription?: string;
  onPlay: () => void;
  onOutboundClick: (href: string) => void;
  className?: string;
  compact?: boolean;
};

export default function ActiveSetCard({
  zone,
  row,
  genreDescription,
  onPlay,
  onOutboundClick,
  className,
  compact = false,
}: ActiveSetCardProps) {
  const href = useMemo(() => sanitizeMediaUrl(row?.soundcloud), [row?.soundcloud]);

  return (
    <article
      className={[
        'w-full overflow-hidden rounded-3xl border border-white/20 bg-[rgba(5,10,22,0.8)] text-white shadow-[0_18px_44px_rgba(4,8,20,0.45)] backdrop-blur-xl',
        compact ? 'p-4' : 'p-5',
        className || '',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em]"
          style={{ backgroundColor: zone.accent, color: '#050816' }}
        >
          {zone.displayName}
        </span>
        <span className="text-[0.7rem] uppercase tracking-[0.22em] text-white/60">Now in zone</span>
      </div>

      {row ? (
        <>
          <button
            type="button"
            onClick={onPlay}
            className="group mb-4 block w-full overflow-hidden rounded-2xl border border-white/20 transition hover:border-white/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/65"
            aria-label={`Play ${row.set}`}
          >
            <SCArtwork url={row.soundcloud || ''} />
            <span className="sr-only">Play {row.set}</span>
          </button>

          <h2 className={compact ? 'text-base font-semibold' : 'text-lg font-semibold'}>{row.set}</h2>
          <div className="mt-2">
            <GenreTooltip label={zone.genreLabel} description={genreDescription}>
              <Tag>
                <span className="uppercase tracking-[0.22em] text-neutral-700">{zone.genreLabel}</span>
              </Tag>
            </GenreTooltip>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onPlay}
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
            >
              Play
            </button>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOutboundClick(href)}
                className="text-sm text-white/80 underline-offset-4 transition hover:text-white hover:underline"
              >
                Open on SoundCloud
              </a>
            ) : (
              <span className="text-sm text-white/45">No outbound link available</span>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <h2 className={compact ? 'text-base font-semibold' : 'text-lg font-semibold'}>No set available yet</h2>
          <p className="text-sm leading-relaxed text-white/70">
            This zone is currently quiet. Pick another district or try again later.
          </p>
        </div>
      )}
    </article>
  );
}

function SCArtwork({ url }: { url: string }) {
  const [art, setArt] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setArt(null);
    setFailed(false);
    if (!url) {
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const response = await fetch(
          `/api/soundcloud-artwork?url=${encodeURIComponent(url)}`,
          { cache: 'no-store' },
        );
        const payload = await response.json();
        if (active) {
          setArt(payload?.artwork || null);
        }
      } catch {
        if (active) setArt(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [url]);

  if (!art || failed) {
    return (
      <div className="aspect-square w-full bg-[radial-gradient(circle_at_28%_20%,rgba(95,188,255,0.55),rgba(42,84,132,0.4)_50%,rgba(4,10,24,1)_95%)]" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={art} alt="" className="aspect-square w-full object-cover" onError={() => setFailed(true)} />
  );
}
