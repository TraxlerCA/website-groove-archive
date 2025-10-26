// src/app/page.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePlayer } from '@/context/PlayerProvider';

type Row = {
  set: string;
  classification?: string | null;
  youtube?: string | null;
  soundcloud?: string | null;
};

// ytId helper removed (unused)

// ytThumbs helper removed (unused)

// on-demand loader for Random serve (no preload on first paint)
async function fetchSoundcloudPicks(max = 5): Promise<Row[]> {
  const res = await fetch('/api/sheets?tabs=list', { cache: 'no-store' });
  const json = await res.json();
  const rows = (json?.data?.list || []) as Row[];
  const pool = rows.filter(r => r.soundcloud && r.soundcloud.includes('soundcloud.com'));
  // random 5
  return [...pool].sort(() => Math.random() - 0.5).slice(0, max);
}

// Icons are now images in /public/icons

export default function Home() {
  const { play } = usePlayer();
  const [serveItems, setServeItems] = React.useState<Row[]>([]);
  const [serveNonce, setServeNonce] = React.useState(0); // force re-animate
  const [loadingServe, setLoadingServe] = React.useState(false);

  async function loadServe() {
    try {
      setLoadingServe(true);
      const picks = await fetchSoundcloudPicks(5);
      setServeItems(picks);
      setServeNonce(n => n + 1);
    } finally {
      setLoadingServe(false);
    }
  }

  // Heatmaps card removed from landing page

  return (
    <main className="container mx-auto max-w-5xl px-6 pt-4 sm:pt-14">
      {/* generous breathing room under the wordmark */}
      <div className="h-4 sm:h-14" />

      <nav className="grid grid-cols-12 gap-7" role="navigation" aria-label="primary">
        {/* neutralize blue; match card styling used by the others */}
        <a href="/serve" aria-label="Serve up a set. Get served a tailored set"
           className="group relative col-span-12 sm:col-span-6 block rounded-2xl border border-neutral-200/70 bg-white/70 backdrop-blur shadow-[0_10px_30px_rgb(0_0_0_/_0.06)] px-8 py-10 transform-gpu hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(0_0_0_/_0.10)] hover:border-black/30 active:translate-y-0 active:scale-[.99] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20">
          <div className="flex items-start gap-3">
            <Image
              src="/icons/icon_serve.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 opacity-80"
            />
            <div>
              <div className="text-lg font-semibold">Serve up a set</div>
              <div className="text-xs font-medium tracking-widest mt-1 opacity-90">Get served a tailored set</div>
            </div>
          </div>
        </a>

        <a href="/list" aria-label="Show the list. Go through all hand-curated grooves"
           className="group relative col-span-12 sm:col-span-6 block rounded-2xl border border-neutral-200/70 bg-white/70 backdrop-blur shadow-[0_10px_30px_rgb(0_0_0_/_0.06)] px-8 py-10 transform-gpu hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(0_0_0_/_0.10)] hover:border-black/30 active:translate-y-0 active:scale-[.99] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20">
          <div className="flex items-start gap-3">
            <Image
              src="/icons/icon_list.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 opacity-80"
            />
            <div>
              <div className="text-lg font-semibold text-neutral-900">Show the list</div>
              <div className="text-xs font-medium tracking-widest text-neutral-500 mt-1">Go through all hand-curated grooves</div>
            </div>
          </div>
        </a>

        {/* Heatmaps entry intentionally removed from landing page */}
      </nav>

      {/* call-to-action: centered dice animation button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={loadServe}
          className="relative inline-flex items-center gap-3 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold shadow-sm hover:shadow-md active:scale-[.99] transition random-serve-dice hover-lift"
        >
          <span className="dice-wrap" aria-hidden="true">
            <Dice variant="a" />
            <Dice variant="b" />
          </span>
          Random serve
        </button>
      </div>
      <style>{`
        /* Dice toss/roll animation: 5s cycle => 4s idle, 1s roll */
        @keyframes diceTossCycle {
          0%, 79.999% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            filter: drop-shadow(0 0 0 rgba(0,0,0,0));
          }
          /* lift-off + first spin */
          82% {
            transform: translate(calc(var(--x, 0px) * .3), -12px) rotate(var(--rA, 200deg)) scale(1.03);
            filter: drop-shadow(0 10px 14px rgba(0,0,0,.18));
          }
          /* descend with momentum */
          90% {
            transform: translate(var(--x, 0px), 4px) rotate(var(--rB, 410deg)) scale(.985);
            filter: drop-shadow(0 5px 10px rgba(0,0,0,.16));
          }
          /* small bounce */
          96% {
            transform: translate(calc(var(--x, 0px) * .6), -3px) rotate(var(--rC, 520deg)) scale(1.01);
            filter: drop-shadow(0 6px 10px rgba(0,0,0,.12));
          }
          /* settle */
          100% {
            transform: translate(0, 0) rotate(var(--rEnd, 540deg)) scale(1);
            filter: drop-shadow(0 0 0 rgba(0,0,0,0));
          }
        }
        .random-serve-dice .dice-wrap { display: inline-flex; align-items: center; gap: 6px; }
        .random-serve-dice .die {
          /* default motion params for die A */
          --x: -8px;
          --rA: 200deg;
          --rB: 410deg;
          --rC: 520deg;
          --rEnd: 540deg;
          animation: diceTossCycle 5s ease-in-out infinite;
          will-change: transform;
          transform-origin: 55% 48%;
        }
        .random-serve-dice .die-b {
          /* mirrored + slightly faster spin for variety */
          --x: 8px;
          --rA: -220deg;
          --rB: -430deg;
          --rC: -560deg;
          --rEnd: -600deg;
          animation-delay: .04s;
          transform-origin: 45% 52%;
        }
        /* Only display the matching face for each die */
        .random-serve-dice .die .face { display: none; }
        .random-serve-dice .die[data-face='1'] .face-1 { display: block; }
        .random-serve-dice .die[data-face='2'] .face-2 { display: block; }
        .random-serve-dice .die[data-face='3'] .face-3 { display: block; }
        .random-serve-dice .die[data-face='4'] .face-4 { display: block; }
        .random-serve-dice .die[data-face='5'] .face-5 { display: block; }
        .random-serve-dice .die[data-face='6'] .face-6 { display: block; }
        @media (prefers-reduced-motion: reduce) {
          .random-serve-dice .die { animation: none; }
        }
      `}</style>

      {/* extra room above the pentagon tiles; render only after click */}
      <section className="mt-6 min-h-[320px]">
        {serveItems.length === 0 ? (
          loadingServe ? (
            <div className="mt-6 text-center text-sm text-neutral-500">
              {'Summoning grooves…'}
            </div>
          ) : null
        ) : (() => {
          // pick 5 soundcloud rows
          const items = serveItems.slice(0, 5);

          // base regular pentagon vertices (% of container, centered at 50/50)
          const BASE = [
            { left: 50.0,  top: 10.0 },   // top
            { left: 88.04, top: 37.64 },  // upper right
            { left: 73.51, top: 82.36 },  // lower right
            { left: 26.49, top: 82.36 },  // lower left
            { left: 11.96, top: 37.64 },  // upper left
          ];
          // shrink pentagon around center without changing tile size
          const center = { x: 50, y: 50 };
          const SHRINK = 0.82; // 82% radius → smaller pentagon
          const PENTA = BASE.map(p => ({
            left: center.x + (p.left - center.x) * SHRINK,
            top:  center.y + (p.top  - center.y) * SHRINK,
          }));
          const sizePct = 28; // tile size as % of container width (unchanged)

          return (
            <div key={serveNonce} className="relative mx-auto aspect-square w-full max-w-3xl">
              {/* outline removed as requested */}

              {items.map((r, i) => {
                const pos = PENTA[i];
                if (!pos) return null;
                return (
                  <motion.button
                    key={i}
                    aria-label={`Play ${r.set}`}
                    onClick={() => play(r, 'soundcloud')}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden border border-neutral-200/70 bg-white shadow-sm hover:shadow-md hover:border-black/30 transition transform-gpu active:scale-[.99]"
                    style={{
                      left: `${pos.left}%`,
                      top: `${pos.top}%`,
                      width: `${sizePct}%`,
                      height: `${sizePct}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.94, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 * i }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98, y: -1 }}
                  >
                    <SCArtwork url={r.soundcloud!} />
                  </motion.button>
                );
              })}

              {/* placeholders if fewer than 5 items */}
              {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, j) => {
                const pos = PENTA[items.length + j];
                if (!pos) return null;
                return (
                  <motion.div
                    key={`ph-${j}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200/60 bg-[radial-gradient(circle_at_30%_30%,#e5e7eb,#fafafa)]"
                    style={{
                      left: `${pos.left}%`,
                      top: `${pos.top}%`,
                      width: `${sizePct}%`,
                      height: `${sizePct}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.94, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 * (items.length + j) }}
                  />
                );
              })}
            </div>
          );
        })()}
      </section>

      <div className="h-14" />
    </main>
  );
}

// CoverBackground component removed (unused)

function Dice({ variant }: { variant: 'a' | 'b' }) {
  const [face, setFace] = React.useState<number>(variant === 'a' ? 1 : 4);
  const onIter = React.useCallback(() => {
    setFace(f => (f % 6) + 1);
  }, []);
  return (
    <svg
      className={`die die-${variant}`}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      role="img"
      focusable="false"
      onAnimationIteration={onIter}
      data-face={face}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#111" stroke="#111" strokeWidth="1.5" />
      {/* Faces 1..6; show one at a time via CSS */}
      <g className="face face-1">
        <circle cx="12" cy="12" r="1.7" fill="#fff" />
      </g>
      <g className="face face-2">
        <circle cx="8" cy="8" r="1.7" fill="#fff" />
        <circle cx="16" cy="16" r="1.7" fill="#fff" />
      </g>
      <g className="face face-3">
        <circle cx="8" cy="8" r="1.7" fill="#fff" />
        <circle cx="12" cy="12" r="1.7" fill="#fff" />
        <circle cx="16" cy="16" r="1.7" fill="#fff" />
      </g>
      <g className="face face-4">
        <circle cx="8" cy="8" r="1.7" fill="#fff" />
        <circle cx="16" cy="8" r="1.7" fill="#fff" />
        <circle cx="8" cy="16" r="1.7" fill="#fff" />
        <circle cx="16" cy="16" r="1.7" fill="#fff" />
      </g>
      <g className="face face-5">
        <circle cx="8" cy="8" r="1.7" fill="#fff" />
        <circle cx="16" cy="8" r="1.7" fill="#fff" />
        <circle cx="12" cy="12" r="1.7" fill="#fff" />
        <circle cx="8" cy="16" r="1.7" fill="#fff" />
        <circle cx="16" cy="16" r="1.7" fill="#fff" />
      </g>
      <g className="face face-6">
        <circle cx="8" cy="7.5" r="1.7" fill="#fff" />
        <circle cx="8" cy="12" r="1.7" fill="#fff" />
        <circle cx="8" cy="16.5" r="1.7" fill="#fff" />
        <circle cx="16" cy="7.5" r="1.7" fill="#fff" />
        <circle cx="16" cy="12" r="1.7" fill="#fff" />
        <circle cx="16" cy="16.5" r="1.7" fill="#fff" />
      </g>
    </svg>
  );
}

function SCArtwork({url, preserveRatio=false}:{url:string; preserveRatio?:boolean}) {
  const [art,setArt]=React.useState<string|null>(null);
  const [failed,setFailed]=React.useState(false);
  React.useEffect(()=>{let ok=true;
    setFailed(false);
    setArt(null);
    if(!url){ return ()=>{ok=false;}; }
    (async()=>{
      try{
        const res=await fetch(`/api/soundcloud-artwork?url=${encodeURIComponent(url)}`,{cache:"no-store"});
        const json=await res.json();
        if(ok) setArt(json?.artwork||null);
      }catch{ if(ok) setArt(null); }
    })();
    return ()=>{ok=false;};
  },[url]);
  if(!art||failed){
    // when preserving natural ratio, we need an in-flow placeholder
    if (preserveRatio) {
      return <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-orange-200 to-orange-400" />;
    }
    // non-preserve case uses a positioned cover
    return <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-400"/>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img
    src={art}
    alt=""
    className={
      preserveRatio
        ? "block w-full h-auto"
        : "absolute inset-0 w-full h-full object-cover"
    }
    onError={()=>setFailed(true)}
  />;
}
