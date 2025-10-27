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

// ytId helper removed (unused)

// ytThumbs helper removed (unused)

// loader for the hero highlight (no preload on first paint)
async function fetchSoundcloudPicks(max = 5): Promise<Row[]> {
  const res = await fetch('/api/sheets?tabs=list', { cache: 'no-store' });
  const json = await res.json();
  const rows = (json?.data?.list || []) as Row[];
  const pool = rows.filter(r => r.soundcloud && r.soundcloud.includes('soundcloud.com'));
  // random 5
  return [...pool].sort(() => Math.random() - 0.5).slice(0, max);
}

export default function Home() {
  const { play } = usePlayer();
  const [featured, setFeatured] = React.useState<Row | null>(null);
  const [loadingFeatured, setLoadingFeatured] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const picks = await fetchSoundcloudPicks(1);
        if (mounted) setFeatured(picks[0] ?? null);
      } finally {
        if (mounted) setLoadingFeatured(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="container mx-auto max-w-5xl px-6 pt-4 sm:pt-14">
      {/* generous breathing room under the wordmark */}
      <div className="h-4 sm:h-14" />

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_#fefefe,_#f3f4f6_55%,_#eef0f4)] px-6 py-12 shadow-[0_28px_60px_rgba(15,23,42,0.12)] sm:px-10 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_rgba(148,163,184,0.08)_55%,_rgba(30,41,59,0.06)_90%)] opacity-60"
        />
        <div className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500">
              Sets collected since 2019
              <span className="h-px w-12 bg-neutral-300" />
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
              Spotted. Curated. Served. Played again. And again.
            </h1>
            <p className="max-w-xl text-base text-neutral-600 sm:text-lg">
              From deep techno to eurotrance, hit serve for instant inspiration, or browse by genre when you know the vibe.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/serve"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-neutral-900/15 transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/20"
              >
                Serve up a set
              </a>
              <a
                href="/list"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-neutral-900/15 transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/20"
              >
                Browse the list
              </a>
            </div>
          </div>

          <aside className="relative isolate rounded-3xl border border-white/40 bg-white/75 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.16)] backdrop-blur">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-white">
                Try this next
              </span>

              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
                {featured?.soundcloud ? (
                  <SCArtwork url={featured.soundcloud} preserveRatio />
                ) : (
                  <div className="h-full w-full animate-pulse rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300" />
                )}
              </div>

              <div className="space-y-2">
                {featured ? (
                  <>
                    <h2 className="text-lg font-semibold text-neutral-900">{featured.set}</h2>
                    {featured.classification ? (
                      <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
                        {featured.classification}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200/80" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200/60" />
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm font-semibold">
                <button
                  type="button"
                  disabled={!featured?.soundcloud}
                  onClick={() => {
                    if (featured?.soundcloud) play(featured, 'soundcloud');
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/30 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={featured?.set ? `Play ${featured.set}` : 'Play highlight (loading)'}
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                {featured?.soundcloud ? (
                  <a
                    className="ml-auto text-neutral-700 underline-offset-4 transition hover:text-neutral-900 hover:underline"
                    href={featured.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open on SoundCloud
                  </a>
                ) : (
                  <span className="ml-auto text-sm text-neutral-400">
                    {loadingFeatured ? 'Fetching a highlight...' : 'No highlight available right now.'}
                  </span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="h-14" />
    </main>
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
