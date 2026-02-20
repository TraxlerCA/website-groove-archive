'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Row } from '@/lib/types';
import { sanitizeMediaUrl } from '@/lib/sanitize';

type CrateCardProps = {
  row: Row;
  isActive: boolean;
  onPlay: (row: Row) => void;
  onOutboundClick: (href: string) => void;
};

export default function CrateCard({
  row,
  isActive,
  onPlay,
  onOutboundClick,
}: CrateCardProps) {
  const href = useMemo(() => sanitizeMediaUrl(row.soundcloud), [row.soundcloud]);

  return (
    <article
      className={[
        'relative overflow-hidden rounded-3xl border border-white/25 bg-[#070b16] p-4 text-white shadow-[0_18px_50px_rgba(4,8,20,0.55)] transition duration-300',
        isActive ? 'opacity-100' : 'opacity-60',
      ].join(' ')}
    >
      <div className="mb-3 inline-flex rounded-full bg-[#1f273d] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-cyan-200">
        Crate Select
      </div>

      <button
        type="button"
        onClick={() => onPlay(row)}
        className="group block w-full overflow-hidden rounded-2xl border border-white/20 transition hover:border-white/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/70"
        aria-label={`Play ${row.set}`}
      >
        <CrateArtwork url={row.soundcloud || ''} />
      </button>

      <h2 className="mt-4 line-clamp-2 text-lg font-semibold leading-tight">{row.set}</h2>
      <p className="mt-1 text-sm text-white/70">{row.classification || 'Unclassified'}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPlay(row)}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
        >
          Play now
        </button>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOutboundClick(href)}
            className="text-sm text-white/80 underline-offset-4 transition hover:text-white hover:underline"
          >
            Open source
          </a>
        ) : null}
      </div>
    </article>
  );
}

function CrateArtwork({ url }: { url: string }) {
  const [art, setArt] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setArt(null);
    setFailed(false);
    if (!url) {
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const response = await fetch(
          `/api/soundcloud-artwork?url=${encodeURIComponent(url)}`,
          { cache: 'no-store' },
        );
        const payload = await response.json();
        if (mounted) setArt(payload?.artwork || null);
      } catch {
        if (mounted) setArt(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [url]);

  if (!art || failed) {
    return (
      <div className="relative aspect-square w-full bg-[radial-gradient(circle_at_30%_20%,rgba(62,202,255,0.45),rgba(17,38,73,0.5)_48%,rgba(2,5,12,1)_95%)]" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={art} alt="" className="aspect-square w-full object-cover" onError={() => setFailed(true)} />
  );
}
