// src/app/suggest/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTitle, Pill, Switch } from '@/components/ui';
import { YouTubeIcon, SCIcon } from '@/components/icons';
import { useRows } from '@/lib/useRows';
import { usePlayer } from '@/context/PlayerProvider';

type Provider='youtube'|'soundcloud';
type PickItem={row:any;provider:Provider};

const subhdr="text-[13px] font-medium tracking-widest text-neutral-600 uppercase";

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
function SCArtwork({url, preserveRatio=false}:{url:string; preserveRatio?:boolean}) {
  const [art,setArt]=useState<string|null>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{let ok=true;(async()=>{
    try{
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

export default function SuggestPage(){
  const { rows }=useRows();
  const { play }=usePlayer();

  // defaults: Any + S-tier off every visit; format persists
  const [genre,setGenre]=useState<'any'|string>('any');
  const [sOnly,setSOnly]=useState(false);
  const [format,setFormat]=useState<'none'|Provider>('soundcloud');

  useEffect(()=>{try{
    setGenre((localStorage.getItem('ga_genre') as any)||'any');
    const f=(localStorage.getItem('ga_format')||'soundcloud').toLowerCase();
    setFormat(f==='youtube'?'youtube':f==='soundcloud'?'soundcloud':'soundcloud');
  }catch{}},[]);
  useEffect(()=>{try{localStorage.setItem('ga_genre',genre);}catch{}},[genre]);
  useEffect(()=>{try{localStorage.setItem('ga_format',format);}catch{}},[format]);

  const genres=useMemo(()=>{const set=new Set(rows.map(r=>(r.classification||'').trim()).filter(Boolean));return [{label:'Any',value:'any' as const},...Array.from(set).sort().map(g=>({label:g,value:g}))];},[rows]);

  const pool=useMemo(()=>rows.filter(r=>{
    if(sOnly&&(r.tier||'').toUpperCase()!=='S')return false;
    if(genre!=='any'&&r.classification!==genre)return false;
    if(format==='youtube')return !!r.youtube;
    if(format==='soundcloud')return !!r.soundcloud;
    return !!(r.youtube||r.soundcloud);
  }),[rows,sOnly,genre,format]);

  const [pick,setPick]=useState<PickItem|null>(null);
  const [isLaunching,setIsLaunching]=useState(false);
  const [hasLaunched,setHasLaunched]=useState(false);

  const chooseProviderForRow=(r:any):Provider=>{
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

  const Circle=({selected}:{selected:boolean})=><span className={`inline-block h-3.5 w-3.5 rounded-full border ${selected?'bg-blue-600 border-blue-600':'border-neutral-400 bg-white'}`}/>;
  const CircleOption=({label,value,icon}:{label:string;value:Provider;icon:JSX.Element})=>(
    <button type="button" aria-pressed={format===value} onClick={()=>setFormat(f=>f===value?'none':value)}
      className={`h-8 px-3 rounded-full border text-sm inline-flex items-center gap-2 ${format===value?'bg-neutral-900 text-white border-neutral-900':'bg-white border-neutral-300 hover:bg-neutral-50'}`}>
      <Circle selected={format===value}/>{icon}<span>{label}</span>
    </button>
  );

  const titleOf=(r:any)=>r?.set||r?.title||r?.name||'Untitled set';
  const labelOf=(r:any)=> (r?.classification||'').trim();

  return (
    <section className="container mx-auto max-w-6xl px-6 mt-10 space-y-8">
      <PageTitle title="SUGGESTOR"/>

      {/* compact controls */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50/60 backdrop-blur p-5 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2">
          <div className="relative p-4 sm:pr-6 flex flex-col gap-6">
            <div>
              <div className={subhdr} style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Genre</div>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                {genres.map(g=><Pill key={g.value} active={genre===g.value} onClick={()=>setGenre(g.value)}>{g.label}</Pill>)}
              </div>
            </div>
            <div>
              <div className={subhdr} style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Format</div>
              <div className="mt-2 flex gap-2">
                <CircleOption label="SoundCloud" value="soundcloud" icon={<SCIcon/>}/>
                <CircleOption label="YouTube" value="youtube" icon={<YouTubeIcon/>}/>
              </div>
            </div>
            <div className="hidden sm:block absolute right-0 top-2 bottom-2 w-px bg-neutral-200"/>
          </div>

          <div className="p-4 sm:pl-6 flex flex-col gap-6">
            <div>
              <div className={subhdr} style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Tier</div>
              <div className="mt-2 flex items-center gap-3">
                <Switch checked={sOnly} onChange={()=>setSOnly(v=>!v)}/><span className="text-sm">S-tier only</span>
              </div>
            </div>
            <div>
              <div className={subhdr} style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Launch</div>
              <motion.button onClick={launch}
                whileHover={{y:-1,scale:1.02,boxShadow:"0 10px 20px rgba(37,99,235,.25)"}}
                whileTap={{y:0,scale:0.98,boxShadow:"0 4px 8px rgba(37,99,235,.18)"}}
                className="mt-2 inline-flex h-11 px-6 rounded-full bg-[var(--accent)] text-white leading-none items-center justify-center select-none">
                {hasLaunched?'Go again!':'Go'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* pulse overlay */}
      <AnimatePresence>
        {isLaunching&&(
          <motion.div className="fixed inset-0 z-40 pointer-events-none"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{background:"radial-gradient(1200px 1200px at 50% 50%, rgba(0,0,0,0.18), transparent 60%)"}}>
            <div className="absolute inset-0 grid place-items-center">
              {[0,1,2].map(i=>(
                <motion.div key={i} initial={{scale:.6,opacity:.55}}
                  animate={{scale:[.6,1.2,1.9],opacity:[.55,.85,0]}}
                  transition={{duration:1,ease:"easeInOut",delay:i*.08}}
                  className="rounded-full border border-black/30" style={{width:240+i*140,height:240+i*140}}/>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* suggestion */}
      {!isLaunching&&pick&&(
        <div className="max-w-4xl mx-auto">
          <motion.article
            whileHover={{ y: -2 }}
            className={
              pick.provider === 'youtube'
                ? 'rounded-2xl border border-neutral-200 overflow-hidden bg-white'
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
                  ? "aspect-video w-1/2 rounded-2xl overflow-hidden"
                  : "w-1/2")
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
          <div className="px-1 pt-4 text-center">
            <h3 className="text-2xl font-semibold break-words" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
              {titleOf(pick.row)}
            </h3>
            {labelOf(pick.row) && (
              <div className="mt-1 text-2xl font-semibold" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
                {labelOf(pick.row)}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
