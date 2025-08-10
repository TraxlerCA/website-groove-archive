'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import * as htmlToImage from 'html-to-image';

type Rating = 'nahh'|'ok'|'hot'|'blazing';
type Row = {
  festival: string; day: string; date?: string; tz?: string;
  stage: string; stage_order?: string | number;
  artist: string; start: string; end: string;
  rating?: Rating | string; label?: string | null; // label kept for data but NOT used for color
};

/* colors */
const RATING_BG: Record<Rating,string> = {
  nahh:'bg-blue-500 text-white',
  ok:'bg-yellow-400 text-neutral-900',
  hot:'bg-orange-500 text-white',
  blazing:'bg-red-600 text-white'
};
/* no bg here; let rating color win */
const CARD_BASE = 'rounded-md border border-neutral-200 shadow-sm';

const norm=(v?:string)=> (v??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const toMin=(t:string)=>{const s=norm(t); const [h,m]=s.split(':').map(n=>parseInt(n,10)); return (isNaN(h)?0:h)*60+(isNaN(m)?0:m);};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

/* buckets from RATING ONLY (ignore label) */
const toBucket=(s?:string): Rating | ''=>{
  const v=norm(s).toLowerCase();
  if(v==='nahh'||v==='nah'||v==='blue') return 'nahh';
  if(v==='ok'||v==='yellow') return 'ok';
  if(v==='hot'||v==='orange') return 'hot';
  if(v==='blazing'||v==='red'||v==='fire'||v==='🔥') return 'blazing';
  return '';
};
const pickRate=(r:Row): Rating | '' => toBucket(r.rating as string);

export default function TimetablePage(){
  const DEFAULT_CSV='https://docs.google.com/spreadsheets/d/e/2PACX-1vRexqa-1vfj-JdFSSFUjWycho-00d5rLdS76eBgvCbruyvtcVIIom-VM52SvfuhLg-CeHLRp2I6k5B2/pub?gid=116583245&single=true&output=csv';
  const CSV_URL=typeof window!=='undefined'?(new URLSearchParams(location.search).get('csv')||DEFAULT_CSV):DEFAULT_CSV;

  const [rows,setRows]=useState<Row[]>([]);
  const [festival,setFestival]=useState(''); const [day,setDay]=useState('');
  const [pxPerMin,setPxPerMin]=useState(1.0);
  const [exporting,setExporting]=useState(false); const [err,setErr]=useState<string|null>(null);
  const ref=useRef<HTMLDivElement>(null);

  // load + normalize
  useEffect(()=>{
    Papa.parse<Row>(CSV_URL,{download:true,header:true,skipEmptyLines:true,
      complete:(res:ParseResult<Row>)=>{
        const clean=(res.data||[])
          .map(r=>({
            festival:norm(r.festival), day:norm(r.day), date:norm(r.date), tz:norm(r.tz),
            stage:norm(r.stage), stage_order:Number((r.stage_order as any) ?? 9999),
            artist:norm(r.artist), start:norm(r.start), end:norm(r.end),
            rating:norm(r.rating as string), label:norm(r.label||'')
          }))
          .filter(r=>r.festival&&r.day&&r.stage&&r.artist&&r.start&&r.end);
        setRows(clean);
      }
    });
  },[CSV_URL]);

  // selectors
  const festivals=useMemo(()=>Array.from(new Set(rows.map(r=>r.festival))).sort(),[rows]);
  const days=useMemo(()=>Array.from(new Set(rows.filter(r=>!festival||r.festival===festival).map(r=>r.day))),[rows,festival]);
  useEffect(()=>{if(!festival&&festivals[0])setFestival(festivals[0]);},[festivals,festival]);
  useEffect(()=>{if(!day&&days[0])setDay(days[0]);},[days,day]);

  const data=useMemo(()=>rows.filter(r=>r.festival===festival&&r.day===day),[rows,festival,day]);

  const stages=useMemo(()=>{
    const map=new Map<string,number>();
    data.forEach(r=>{const ord=Number(r.stage_order??9999); map.set(r.stage, Math.min(map.get(r.stage)??ord, ord));});
    return Array.from(map.entries()).sort((a,b)=>a[1]-b[1]).map(([s])=>s);
  },[data]);

  const minStart=useMemo(()=>data.length?Math.min(...data.map(r=>toMin(r.start))):0,[data]);
  const maxEnd=useMemo(()=>data.length?Math.max(...data.map(r=>toMin(r.end))):0,[data]);
  const totalMin=clamp(Math.max(60,maxEnd-minStart),60,16*60);
  const heightPx=Math.round(totalMin*pxPerMin);

  const hours=useMemo(()=>{
    const s=Math.floor(minStart/60), e=Math.ceil(maxEnd/60);
    return Array.from({length:Math.max(0,e-s+1)},(_,i)=>(s+i)*60);
  },[minStart,maxEnd]);

  // export
  async function exportPng(){
    if(!ref.current) return; setErr(null); setExporting(true);
    try{
      const dataUrl=await htmlToImage.toPng(ref.current,{pixelRatio:2,backgroundColor:'#ffffff',cacheBust:true,skipFonts:true} as any);
      const a=document.createElement('a'); a.href=dataUrl; a.download=`${festival}-${day}.png`; a.click();
    }catch(e:any){ setErr(e?.message||'Export failed'); console.error(e);} finally{ setExporting(false); }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs tracking-[0.25em] font-semibold text-neutral-700">THE GROOVE ARCHIVE</div>
          <h1 className="text-3xl font-semibold tracking-wide text-neutral-900">Timetable heatmap</h1>
          <div className="mt-1 text-sm text-neutral-500">Clean render. Neutral tiles. Colored cells by rating. No clicks.</div>
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" value={festival} onChange={e=>setFestival(e.target.value)}>
            {festivals.map(f=><option key={f}>{f}</option>)}
          </select>
          <select className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" value={day} onChange={e=>setDay(e.target.value)}>
            {days.map(d=><option key={d}>{d}</option>)}
          </select>
          <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60" onClick={exportPng} disabled={exporting}>
            {exporting?'Exporting…':'Export PNG'}
          </button>
        </div>
      </div>

      {err&&<div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      {/* legend */}
      <div className="mb-4 flex items-center gap-8 text-base">
        <span className="inline-flex items-center gap-2"><span className="inline-block h-3 w-6 rounded bg-blue-500" /> nahh</span>
        <span className="inline-flex items-center gap-2"><span className="inline-block h-3 w-6 rounded bg-yellow-400" /> ok</span>
        <span className="inline-flex items-center gap-2"><span className="inline-block h-3 w-6 rounded bg-orange-500" /> hot</span>
        <span className="inline-flex items-center gap-2"><span className="inline-block h-3 w-6 rounded bg-red-600" /> blazing</span>
      </div>

      {/* heatmap title (hyphen) */}
      <h2 className="mb-3 text-center text-2xl font-semibold tracking-wide text-neutral-900">
        {festival}{festival&&day?' - ':''}{day}
      </h2>

      {/* timetable */}
      <div ref={ref} className="rounded-xl border border-neutral-200 bg-white p-4">
        {/* stage headers */}
        <div className="grid items-stretch gap-2" style={{gridTemplateColumns:`72px repeat(${stages.length},minmax(0,1fr))`}}>
          <div />
          {stages.map(s=>(
            <div key={s} className="text-center text-[13px] font-medium tracking-wide text-neutral-700">{s}</div>
          ))}
        </div>

        {/* grid body */}
        <div className="mt-2 grid gap-2" style={{gridTemplateColumns:`72px repeat(${stages.length},minmax(0,1fr))`}}>
          {/* time ruler */}
          <div className="relative">
            <div className={`${CARD_BASE} relative bg-white`} style={{height:heightPx}}>
              {hours.map(h=>(
                <div key={`tick-${h}`} className="absolute right-0 w-4 -translate-y-px border-t border-neutral-300" style={{top:(h-minStart)*pxPerMin}}/>
              ))}
              {hours.map(h=>(
                <div key={`t-${h}`} className="absolute right-6 -translate-y-2 text-[12px] tabular-nums text-neutral-600" style={{top:(h-minStart)*pxPerMin}}>
                  {String(Math.floor(h/60)).padStart(2,'0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* stage columns */}
          {stages.map(stage=>{
            const sets=data.filter(r=>r.stage===stage).sort((a,b)=>toMin(a.start)-toMin(b.start));
            return (
              <div key={stage} className="relative">
                <div className={`${CARD_BASE} relative bg-white`} style={{height:heightPx}}>
                  {/* hour grid lines */}
                  {hours.map(h=>(
                    <div key={h} className="absolute left-0 right-0 h-px bg-neutral-100" style={{top:(h-minStart)*pxPerMin}}/>
                  ))}
                  {/* sets */}
                  {sets.map((r,i)=>{
                    const top=(toMin(r.start)-minStart)*pxPerMin;
                    const height=Math.max(28,(toMin(r.end)-toMin(r.start))*pxPerMin);
                    const bucket=pickRate(r);
                    const colored=bucket ? RATING_BG[bucket] : 'bg-white text-neutral-900';
                    return (
                      <div key={stage+'-'+i} className="absolute left-2 right-2" style={{top}}>
                        <div className={`${CARD_BASE} ${colored} flex items-center justify-center text-center px-2`} style={{height}}>
                          <div className="text-[13px] leading-snug">{r.artist}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* density */}
      <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600">
        <label>density</label>
        <input type="range" min={0.6} max={2.0} step={0.05} value={pxPerMin}
               onChange={e=>setPxPerMin(parseFloat((e.target as HTMLInputElement).value))}/>
        <span>{pxPerMin.toFixed(2)} px/min</span>
      </div>
    </div>
  );
}
