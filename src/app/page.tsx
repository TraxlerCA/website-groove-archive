// src/app/page.tsx
'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerProvider';

type Row = {
  set: string;
  classification?: string | null;
  youtube?: string | null;
  soundcloud?: string | null;
};

// parse YouTube id
function ytId(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const seg = url.pathname.split('/');
    const i = seg.indexOf('embed');
    if (i >= 0 && seg[i + 1]) return seg[i + 1];
  } catch {}
  return null;
}

// ordered 16:9 thumbs
function ytThumbs(u?: string | null) {
  const id = ytId(u);
  if (!id) return [];
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hq720.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  ];
}

function useCollage(max = 5) {
  const [items, setItems] = React.useState<Row[]>([]);
  React.useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await fetch('/api/sheets?tabs=list', { cache: 'no-store' });
        const json = await res.json();
        const rows = (json?.data?.list || []) as Row[];
        const pool = rows.filter(r => r.youtube || r.soundcloud);
        const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, max);
        if (ok) setItems(picked);
      } catch {
        if (ok) setItems([]);
      }
    })();
    return () => { ok = false; };
  }, [max]);
  return items;
}

const PlusIcon = () => (
  <svg className="h-6 w-6 opacity-80" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const ListIcon = () => (
  <svg className="h-6 w-6 opacity-80" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M6 7h12M6 12h12M6 17h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const HeatIcon = () => (
  <svg className="h-6 w-6 opacity-80" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3C9 7 16 9 16 13a4 4 0 1 1-8 0c0-2 1-3 2-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function Home() {
  const collage = useCollage(5);
  const { play } = usePlayer();

  return (
    <main className="container mx-auto max-w-5xl px-6 pt-10">
      {/* keep a bit of breathing room under the wordmark (no hero title, no blue glow) */}
      <div className="h-6 sm:h-8" />

      {/* CTAs */}
      <nav className="grid grid-cols-12 gap-6" role="navigation" aria-label="primary">
        {/* primary */}
        <a
          href="/suggest"
          aria-label="Suggest a set. Get served a tailored set"
          className="group relative col-span-12 sm:col-span-4 block rounded-2xl border border-blue-600/60
                     bg-gradient-to-b from-blue-600 to-blue-700 text-white backdrop-blur px-8 py-10
                     shadow-[0_10px_30px_rgb(37_99_235_/_0.18)] transform-gpu
                     hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(37_99_235_/_0.25)]
                     active:translate-y-0 active:scale-[.99]
                     transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <div className="flex items-start gap-3">
            <PlusIcon />
            <div>
              <div className="text-lg font-semibold">Suggest a set</div>
              <div className="text-xs font-medium tracking-widest mt-1 opacity-90">
                Get served a tailored set
              </div>
            </div>
          </div>
        </a>

        {/* secondary */}
        <a
          href="/list"
          aria-label="Show the list. Go through all hand-curated grooves"
          className="group relative col-span-12 sm:col-span-4 block rounded-2xl border border-neutral-200/70 bg-white/70
                     backdrop-blur shadow-[0_10px_30px_rgb(0_0_0_/_0.06)] px-8 py-10 transform-gpu
                     hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(0_0_0_/_0.10)]
                     hover:border-blue-400/40 active:translate-y-0 active:scale-[.99]
                     transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <div className="flex items-start gap-3">
            <ListIcon />
            <div>
              <div className="text-lg font-semibold text-neutral-900">Show the list</div>
              <div className="text-xs font-medium tracking-widest text-neutral-500 mt-1">
                Go through all hand-curated grooves
              </div>
            </div>
          </div>
        </a>

        <a
          href="/heatmaps"
          aria-label="Map the heat. Glimpse that festival fire"
          className="group relative col-span-12 sm:col-span-4 block rounded-2xl border border-neutral-200/70 bg-white/70
                     backdrop-blur shadow-[0_10px_30px_rgb(0_0_0_/_0.06)] px-8 py-10 transform-gpu
                     hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(0_0_0_/_0.10)]
                     hover:border-blue-400/40 active:translate-y-0 active:scale-[.99]
                     transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <div className="flex items-start gap-3">
            <HeatIcon />
            <div>
              <div className="text-lg font-semibold text-neutral-900">Map the heat</div>
              <div className="text-xs font-medium tracking-widest text-neutral-500 mt-1">
                Glimpse that festival fire
              </div>
            </div>
          </div>
        </a>
      </nav>

      {/* header between tiles and collage */}
      <div className="mt-8 mb-3 text-sm font-semibold text-neutral-700" style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>
        Random serve
      </div>

      {/* collage: max 5 items, perfectly filled thumbnails, clickable */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {collage.map((r, i) => {
            const urls = ytThumbs(r.youtube);
            const hasYT = urls.length > 0;
            const provider = hasYT ? 'youtube' : 'soundcloud';
            return (
              <button
                key={i}
                aria-label={`Play ${r.set}`}
                onClick={() => play(r as any, provider as any)}
                className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200/70 bg-white shadow-sm
                           hover:shadow-md hover:border-blue-400/40 transition transform-gpu active:scale-[.99]"
              >
                {/* full-cover background to avoid any white/letterboxing */}
                {hasYT ? (
                  <CoverBackground urls={urls} />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-400" />
                )}
              </button>
            );
          })}
          {/* pad to full row if fewer than 5 returned */}
          {Array.from({ length: Math.max(0, 5 - collage.length) }).map((_, i) => (
            <div
              key={`ph-${i}`}
              className="aspect-square rounded-xl border border-neutral-200/60 bg-[radial-gradient(circle_at_30%_30%,#e5e7eb,#fafafa)]"
            />
          ))}
        </div>
      </section>

      {/* bottom spacer so it breathes */}
      <div className="h-10" />
    </main>
  );
}

/** paint the image as a CSS background that always covers and centers; keep an <img> hidden for error fallback */
function CoverBackground({ urls }: { urls: string[] }) {
  const [idx, setIdx] = React.useState(0);
  const src = urls[idx];

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* hidden image solely to detect load failure and step to the next candidate */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="hidden"
        onError={() => {
          if (idx < urls.length - 1) setIdx(idx + 1);
        }}
      />
    </div>
  );
}
