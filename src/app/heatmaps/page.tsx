'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import * as htmlToImage from 'html-to-image';

type Rating = 'nahh'|'ok'|'hot'|'blazing';
type Row = {
  festival: string; day: string; date?: string; tz?: string;
  stage: string; stage_order?: string | number;
  artist: string; start: string; end: string;
  rating: Rating | string; label?: string | null;
};

const RATING_TEXT_COLOR: Record<string, string> = {
  nahh: 'text-neutral-500', ok: 'text-yellow-600', hot: 'text-orange-600', blazing: 'text-red-600'
};
const NEUTRAL_CARD = 'rounded-md border border-neutral-200 bg-white shadow-sm';

const toMin = (t: string)=>{ const [h,m] = t.split(':').map(n=>parseInt(n,10)); return h*60+(m||0); };
const clamp = (n:number,min:number,max:number)=> Math.max(min, Math.min(max,n));

export default function TimetablePage(){
  const DEFAULT_CSV =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRexqa-1vfj-JdFSSFUjWycho-00d5rLdS76eBgvCbruyvtcVIIom-VM52SvfuhLg-CeHLRp2I6k5B2/pub?gid=116583245&single=true&output=csv';
  const CSV_URL = typeof window !== 'undefined'
    ? (new URLSearchParams(location.search).get('csv') || DEFAULT_CSV)
    : DEFAULT_CSV;

  const [rows, setRows] = useState<Row[]>([]);
  const [festival, setFestival] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    Papa.parse<Row>(CSV_URL, {
      download: true, header: true, skipEmptyLines: true,
      complete: (results: ParseResult<Row>) => {
        const clean = (results.data || []).filter(r => r.festival && r.day && r.stage && r.artist && r.start && r.end);
        setRows(clean);
      }
    });
  },[CSV_URL]);

  const festivals = useMemo(()=>Array.from(new Set(rows.map(r=>r.festival))).sort(),[rows]);
  const days = useMemo(()=>Array.from(new Set(rows.filter(r=>!festival || r.festival===festival).map(r=>r.day))),[rows,festival]);

  useEffect(()=>{ if(!festival && festivals[0]) setFestival(festivals[0]); },[festivals,festival]);
  useEffect(()=>{ if(!day && days[0]) setDay(days[0]); },[days,day]);

  const data = useMemo(()=> rows.filter(r=>r.festival===festival && r.day===day),[rows,festival,day]);

  const stages = useMemo(()=>{
    const map = new Map<string, number>();
    data.forEach(r=>{
      const ord = Number(r.stage_order ?? 9999);
      map.set(r.stage, Math.min(map.get(r.stage) ?? ord, ord));
    });
    return Array.from(map.entries()).sort((a,b)=>a[1]-b[1]).map(([s])=>s);
  },[data]);

  const [pxPerMin, setPxPerMin] = useState(1.0);
  const minStart = useMemo(()=> data.length ? Math.min(...data.map(r=>toMin(r.start))) : 0,[data]);
  const maxEnd   = useMemo(()=> data.length ? Math.max(...data.map(r=>toMin(r.end)))   : 0,[data]);
  const totalMin = clamp(Math.max(60, maxEnd - minStart), 60, 16*60);
  const heightPx = Math.round(totalMin * pxPerMin);

  const hours = useMemo(()=>{
    const startH = Math.floor(minStart/60), endH = Math.ceil(maxEnd/60);
    return Array.from({length: Math.max(0, endH-startH+1)},(_,i)=> (startH+i)*60);
  },[minStart,maxEnd]);

  async function exportPng(){
    if(!ref.current) return;
    const dataUrl = await htmlToImage.toPng(ref.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const a = document.createElement('a'); a.href = dataUrl; a.download = `${festival}-${day}.png`; a.click();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs tracking-[0.25em] font-semibold text-neutral-700">THE GROOVE ARCHIVE</div>
          <h1 className="text-3xl font-semibold tracking-wide text-neutral-900">Timetable heatmap</h1>
          <div className="mt-1 text-sm text-neutral-500">Clean render. Neutral tiles, colored labels. No clicks.</div>
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" value={festival} onChange={e=>setFestival(e.target.value)}>
            {festivals.map(f=><option key={f}>{f}</option>)}
          </select>
          <select className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" value={day} onChange={e=>setDay(e.target.value)}>
            {days.map(d=><option key={d}>{d}</option>)}
          </select>
          <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50" onClick={exportPng}>Export PNG</button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-6 text-xs">
        <span className="text-neutral-500">nahh</span>
        <span className="text-yellow-600">ok</span>
        <span className="text-orange-600">hot</span>
        <span className="text-red-600">blazing</span>
      </div>

      <div ref={ref} className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="grid items-stretch gap-2" style={{ gridTemplateColumns: `64px repeat(${stages.length}, minmax(0, 1fr))` }}>
          <div />
          {stages.map(s=>(
            <div key={s} className="text-center text-[13px] font-medium tracking-wide text-neutral-700">{s}</div>
          ))}
        </div>

        <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `64px repeat(${stages.length}, minmax(0, 1fr))` }}>
          <div className="relative">
            <div className={NEUTRAL_CARD} style={{height: heightPx}}>
              {hours.map(h=>(
                <div key={h} className="absolute left-0 right-0 h-px bg-neutral-200" style={{ top: (h - minStart) * pxPerMin }} />
              ))}
              {hours.map(h=>(
                <div key={`label-${h}`} className="absolute left-2 -translate-y-2 text-[11px] text-neutral-500" style={{ top: (h - minStart) * pxPerMin }}>
                  {String(Math.floor(h/60)).padStart(2,'0')}:00
                </div>
              ))}
            </div>
          </div>

          {stages.map(stage=>{
            const sets = data.filter(r=>r.stage===stage).sort((a,b)=>toMin(a.start)-toMin(b.start));
            return (
              <div key={stage} className="relative">
                <div className={NEUTRAL_CARD} style={{height: heightPx}}>
                  {hours.map(h=>(
                    <div key={h} className="absolute left-0 right-0 h-px bg-neutral-100" style={{ top: (h - minStart) * pxPerMin }} />
                  ))}
                  {sets.map((r,i)=>{
                    const top = (toMin(r.start)-minStart)*pxPerMin;
                    const height = Math.max(22, (toMin(r.end)-toMin(r.start))*pxPerMin);
                    const rate = (r.rating||'').toLowerCase() as Rating | string;
                    const colorClass = RATING_TEXT_COLOR[rate] || 'text-neutral-600';
                    return (
                      <div key={stage+'-'+i} className="absolute left-2 right-2">
                        <div className={`relative ${NEUTRAL_CARD}`} style={{ top, height }}>
                          <div className="absolute inset-0 rounded-md" />
                          <div className="p-2">
                            <div className="text-[13px] leading-tight text-neutral-900">{r.artist}</div>
                            <div className={`mt-0.5 text-[11px] font-medium ${colorClass}`}>{(r.label?.trim() || rate)}</div>
                            <div className="mt-1 text-[10px] text-neutral-500">{r.start} - {r.end}</div>
                          </div>
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

      <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600">
        <label>density</label>
        <input type="range" min={0.6} max={2.0} step={0.05} value={pxPerMin} onChange={e=>setPxPerMin(parseFloat((e.target as HTMLInputElement).value))}/>
        <span>{pxPerMin.toFixed(2)} px/min</span>
      </div>
    </div>
  );
}
