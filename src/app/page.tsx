// src/app/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePlayer } from '@/context/PlayerProvider';

type Row = {
  set: string;
  classification?: string | null;
  youtube?: string | null;
  soundcloud?: string | null;
};

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

function ytThumbs(u?: string | null) {
  const id = ytId(u); if (!id) return [];
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  ];
}

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
    <main className="container mx-auto max-w-5xl px-6 pt-14">
      {/* generous breathing room under the wordmark */}
      <div className="h-10 sm:h-14" />

      <nav className="grid grid-cols-12 gap-7" role="navigation" aria-label="primary">
        {/* neutralize blue; match card styling used by the others */}
        <a href="/serve" aria-label="Serve up a set. Get served a tailored set"
           className="group relative col-span-12 sm:col-span-6 block rounded-2xl border border-neutral-200/70 bg-white/70 backdrop-blur shadow-[0_10px_30px_rgb(0_0_0_/_0.06)] px-8 py-10 transform-gpu hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(0_0_0_/_0.10)] hover:border-blue-400/40 active:translate-y-0 active:scale-[.99] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <div className="flex items-start gap-3"><img src="/icons/icon_serve.png" alt="" className="h-6 w-6 opacity-80" /><div><div className="text-lg font-semibold">Serve up a set</div><div className="text-xs font-medium tracking-widest mt-1 opacity-90">Get served a tailored set</div></div></div>
        </a>

        <a href="/list" aria-label="Show the list. Go through all hand-curated grooves"
           className="group relative col-span-12 sm:col-span-6 block rounded-2xl border border-neutral-200/70 bg-white/70 backdrop-blur shadow-[0_10px_30px_rgb(0_0_0_/_0.06)] px-8 py-10 transform-gpu hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(0_0_0_/_0.10)] hover:border-blue-400/40 active:translate-y-0 active:scale-[.99] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <div className="flex items-start gap-3"><img src="/icons/icon_list.png" alt="" className="h-6 w-6 opacity-80" /><div><div className="text-lg font-semibold text-neutral-900">Show the list</div><div className="text-xs font-medium tracking-widest text-neutral-500 mt-1">Go through all hand-curated grooves</div></div></div>
        </a>

        {/* Heatmaps entry intentionally removed from landing page */}
      </nav>

      {/* call-to-action: centered pulse button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={loadServe}
          className="relative inline-flex items-center gap-3 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold shadow-sm hover:shadow-md active:scale-[.99] transition"
        >
          <img src="/icons/icon_random_serve.png" alt="" className="h-[18px] w-[18px] opacity-70" />
          Random serve
          {/* subtle pulse every 3s */}
          <span className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-blue-400/30 animate-[pulse3_3s_ease-in-out_infinite]"/>
        </button>
      </div>
      <style>{`
        @keyframes pulse3 {
          0% { transform: scale(1); opacity: .4; }
          30% { transform: scale(1.06); opacity: .9; }
          60% { transform: scale(1); opacity: .4; }
          100% { transform: scale(1); opacity: .4; }
        }
      `}</style>

      {/* extra room above the pentagon tiles; render only after click */}
      <section className="mt-6 min-h-[320px]">
        {serveItems.length === 0 ? (
          <div className="mt-6 text-center text-sm text-neutral-500">
            {loadingServe ? 'Summoning grooves…' : 'Tap the Random serve button to load tiles'}
          </div>
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
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden border border-neutral-200/70 bg-white shadow-sm hover:shadow-md hover:border-blue-400/40 transition transform-gpu active:scale-[.99]"
                    style={{
                      left: `${pos.left}%`,
                      top: `${pos.top}%`,
                      width: `${sizePct}%`,
                      height: `${sizePct}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.94, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 * i }}
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

function CoverBackground({ urls }: { urls: string[] }) {
  const [idx, setIdx] = React.useState(0);
  const src = urls[idx];
  return (
    <div className="absolute inset-0" style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <img src={src} alt="" className="hidden" onError={() => { if (idx < urls.length - 1) setIdx(idx + 1); }} />
    </div>
  );
}

function SCArtwork({url, preserveRatio=false}:{url:string; preserveRatio?:boolean}) {
  const [art,setArt]=React.useState<string|null>(null);
  const [failed,setFailed]=React.useState(false);
  React.useEffect(()=>{let ok=true;(async()=>{
    try{
      const res=await fetch(`/api/soundcloud-artwork?url=${encodeURIComponent(url)}`,{cache:"no-store"});
      const json=await res.json();
      if(ok) setArt(json?.artwork||null);
    }catch{ if(ok) setArt(null); }
  })(); return ()=>{ok=false};},[url]);
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
