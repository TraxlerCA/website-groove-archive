// src/app/serve/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTitle } from '@/components/ui';
import { YouTubeIcon, SCIcon } from '@/components/icons';
import { useRows } from '@/lib/useRows';
import { usePlayer } from '@/context/PlayerProvider';
import type { Row } from '@/lib/useRows';

type Provider='youtube'|'soundcloud';
type PickItem={row: Row; provider: Provider};

const subhdr="text-[12px] font-medium tracking-wide text-neutral-600 uppercase";

/* youtube utilities */
const ytId=(u?:string|null)=>{if(!u) return null;try{const url=new URL(u);if(url.hostname.includes('youtu.be'))return url.pathname.slice(1);if(url.searchParams.get('v'))return url.searchParams.get('v');const p=url.pathname.split('/');const i=p.indexOf('embed');if(i>=0&&p[i+1])return p[i+1];return null;}catch{return null;}};

/* 16:9 thumbnail component with fallbacks to avoid letterboxing */
function YTThumb({url}:{url?:string|null}) {
  const id=ytId(url);
  const order=id?[
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, // 1280x720 if available
    `https://i.ytimg.com/vi/${id}/hq720.jpg`,         // 1280x720 16:9
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,     // 320x180 16:9
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,     // 480x360 (fallback)
  ]:[];
  const [idx,setIdx]=useState(0);
  const tried = useRef(0);
  if(!id) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={order[idx]} alt="" className="absolute inset-0 w-full h-full object-cover block"
      onError={()=>{if(tried.current<order.length-1){tried.current++;setIdx(i=>i+1);}}}/>
  );
}

/* SoundCloud artwork using your existing API route */
function SCArtwork({url, preserveRatio=false}:{url:string | null; preserveRatio?:boolean}) {
  const [art,setArt]=useState<string|null>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{let ok=true;(async()=>{
    try{
      if(!url){ if(ok) setArt(null); return; }
      const res=await fetch(`/api/soundcloud-artwork?url=${encodeURIComponent(url)}`,{cache:"no-store"});
      const json=await res.json();
      if(ok) setArt(json?.artwork||null);
    }catch{ if(ok) setArt(null); }
  })(); return ()=>{ok=false};},[url]);  
  if(!art||failed){
    return <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-400"/>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img
    src={art}
    alt=""
    className={
      preserveRatio
        ? "block w-full h-auto" // keep native ratio
        : "absolute inset-0 w-full h-full object-cover"
    }
    onError={()=>setFailed(true)}
  />;
}

export default function ServePage(){
  const { rows }=useRows();
  const { play }=usePlayer();
  const endRef = useRef<HTMLDivElement | null>(null);

  // defaults: Any; format persists
  const [genre,setGenre]=useState<'any'|string>('any');
  const [format,setFormat]=useState<'none'|Provider>('soundcloud');

  useEffect(()=>{try{
    setGenre((localStorage.getItem('ga_genre') ?? 'any') as 'any' | string);
    const f=(localStorage.getItem('ga_format')||'soundcloud').toLowerCase();
    setFormat(f==='youtube'?'youtube':f==='soundcloud'?'soundcloud':'soundcloud');
  }catch{}},[]);
  useEffect(()=>{try{localStorage.setItem('ga_genre',genre);}catch{}},[genre]);
  useEffect(()=>{try{localStorage.setItem('ga_format',format);}catch{}},[format]);

  const genres=useMemo(()=>{const set=new Set(rows.map(r=>(r.classification||'').trim()).filter(Boolean));return [{label:'Any',value:'any' as const},...Array.from(set).sort().map(g=>({label:g,value:g}))];},[rows]);

  const pool=useMemo(()=>rows.filter(r=>{
    if(genre!=='any'&&r.classification!==genre)return false;
    if(format==='youtube')return !!r.youtube;
    if(format==='soundcloud')return !!r.soundcloud;
    return !!(r.youtube||r.soundcloud);
  }),[rows,genre,format]);

  const [pick,setPick]=useState<PickItem|null>(null);
  const [isLaunching,setIsLaunching]=useState(false);
  const [hasLaunched,setHasLaunched]=useState(false);

  // After a suggestion is shown on mobile, scroll it into view
  useEffect(()=>{
    if(!pick) return;
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 640;
    if(!isMobile) return;
    const id = window.setTimeout(()=>{
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
    return ()=> window.clearTimeout(id);
  },[pick]);

  const chooseProviderForRow=(r: Row):Provider=>{
    if(format==='youtube'&&r.youtube)return'youtube';
    if(format==='soundcloud'&&r.soundcloud)return'soundcloud';
    if(r.youtube&&r.soundcloud)return Math.random()<0.5?'youtube':'soundcloud';
    return r.youtube?'youtube':'soundcloud';
  };

  const launch=()=>{
    setIsLaunching(true);
    const chosenRow=[...pool].sort(()=>Math.random()-.5)[0]||null;
    const chosen=chosenRow?{row:chosenRow,provider:chooseProviderForRow(chosenRow)}:null;
    setTimeout(()=>{setPick(chosen);setIsLaunching(false);setHasLaunched(true);},1000);
  };

  const Circle=({selected}:{selected:boolean})=><span className={`inline-block h-3 w-3 rounded-full border ${selected?'bg-blue-600 border-blue-600':'border-neutral-400 bg-white'}`}/>;
  const CircleOption=({label,value,icon}:{label:string;value:Provider;icon:ReactElement})=>(
    <button type="button" aria-pressed={format===value} onClick={()=>setFormat(f=>f===value?'none':value)}
      className={`h-10 px-3 rounded-lg border text-sm inline-flex items-center gap-2 ${format===value?'bg-neutral-900 text-white border-neutral-900':'bg-white border-neutral-300 hover:bg-neutral-50'}`}>
      <Circle selected={format===value}/>{icon}<span>{label}</span>
    </button>
  );

  const titleOf=(r: Row)=>r?.set||'Untitled set';
  const labelOf=(r: Row)=> (r?.classification||'').trim();  

  return (
    <section className="container mx-auto max-w-6xl px-6 mt-8 space-y-6">
      <PageTitle title="SERVER"/>

      {/* compact controls */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 backdrop-blur p-4 shadow-sm max-w-2xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Genre left */}
          <div className="p-4 sm:pr-6">
            <div className={subhdr} style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Genre</div>
            <div className="mt-1.5">
              <select
                className="w-full sm:w-auto min-w-56 h-10 rounded-lg border border-neutral-300 bg-white px-4 text-sm"
                value={genre}
                onChange={(e)=>setGenre(e.target.value)}
              >
                {genres.map(g=> (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Format right */}
          <div className="p-4 sm:pl-6">
            <div className={subhdr} style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Format</div>
            <div className="mt-1.5 flex gap-2 justify-start sm:justify-end">
              <CircleOption label="SoundCloud" value="soundcloud" icon={<SCIcon/>}/>
              <CircleOption label="YouTube" value="youtube" icon={<YouTubeIcon/>}/>
            </div>
          </div>
          {/* Go button row */}
          <div className="p-3 sm:col-span-2 grid place-items-center">
            <motion.button onClick={launch}
              whileHover={{y:-1,scale:1.01,boxShadow:"0 8px 16px rgba(37,99,235,.2)"}}
              whileTap={{y:0,scale:0.99,boxShadow:"0 4px 10px rgba(37,99,235,.15)"}}
              disabled={isLaunching}
              className="mt-0 inline-flex h-11 w-72 rounded-full bg-[var(--accent)] text-white leading-none items-center justify-center select-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {hasLaunched?'Go again!':'Go'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* vinyl spin overlay - replaces pulse overlay */}
      <AnimatePresence>
        {isLaunching&&(
          <motion.div
            className="fixed inset-0 z-40 pointer-events-none grid place-items-center"
            initial={{opacity:0}}
            animate={{opacity:1}}
            exit={{opacity:0}}
            style={{background:'radial-gradient(1200px 1200px at 50% 50%, rgba(0,0,0,0.18), transparent 60%)'}}
          >
            <div className="relative">
              <img
                src="/icons/icon_serve.png"
                alt=""
                className="h-40 w-40 sm:h-48 sm:w-48 rounded-full select-none animate-[spin_1s_linear_1] drop-shadow-xl"
                draggable={false}
              />
              <span className="pointer-events-none absolute inset-0 m-auto block h-6 w-6 rounded-full bg-white/90 ring-2 ring-neutral-300" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* suggestion */}
      {!isLaunching&&pick&&(
        <div className="max-w-2xl mx-auto">
          <motion.article
            whileHover={{ y: -2 }}
            className={
              pick.provider === 'youtube'
                ? '' // remove outer white card to avoid wider box than video
                : 'overflow-visible'
            }
            onClick={() => play(pick.row, pick.provider)}
            role="button"
            aria-label="play suggestion"
          >
            <div
              className={
                "relative mx-auto " +
                (pick.provider === 'youtube'
                  ? "aspect-video w-full sm:w-4/5 md:w-3/4 rounded-2xl overflow-hidden"
                  : "w-full sm:w-4/5 md:w-3/4")
              }
              style={pick.provider === 'soundcloud'
                ? { aspectRatio: 'auto' }
                : undefined
              }
            >
              {pick.provider === 'youtube'
                ? <YTThumb url={pick.row.youtube}/>
                : <SCArtwork url={pick.row.soundcloud} preserveRatio />}
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="rounded-full bg-white/90 border border-neutral-300 w-14 h-14 grid place-items-center">
                  {pick.provider==='youtube'?<YouTubeIcon/>:<SCIcon/>}
                </div>
              </div>
            </div>
          </motion.article>

          {/* big title and label (no dot) */}
          <div className="px-1 pt-3 text-center">
            <h3 className="text-2xl font-semibold leading-tight break-words" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
              {titleOf(pick.row)}
            </h3>
            {labelOf(pick.row) && (
              <div className="mt-1 text-2xl font-semibold leading-tight" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
                {labelOf(pick.row)}
              </div>
            )}
          </div>
        </div>
      )}
      {/* bottom spacer and anchor for scrolling */}
      <div ref={endRef} className="h-8 sm:h-4" />
    </section>
  );
}
