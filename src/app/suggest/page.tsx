// src/app/suggest/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageTitle, Pill, Switch, Tag, IconButton } from '@/components/ui';
import { YouTubeIcon, SCIcon } from '@/components/icons';
import { lc } from '@/lib/utils';
import { useRows } from '@/lib/useRows';
import { usePlayer } from '@/context/PlayerProvider';

export default function SuggestPage() {
  const { rows } = useRows();
  const { play } = usePlayer();

  // client-safe persisted UI state
  const [genre, setGenre] = useState<string>('any');
  const [sOnly, setSOnly] = useState<boolean>(false);
  const [format, setFormat] = useState<'-'|'YouTube'|'SoundCloud'| 'both'>('-');
  useEffect(() => { try { setGenre(localStorage.getItem('ga_genre') || 'any'); setSOnly(localStorage.getItem('ga_sOnly')==='1'); setFormat((localStorage.getItem('ga_format') as any)||'-'); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem('ga_genre', genre); } catch {} }, [genre]);
  useEffect(() => { try { localStorage.setItem('ga_sOnly', sOnly ? '1':'0'); } catch {} }, [sOnly]);
  useEffect(() => { try { localStorage.setItem('ga_format', format); } catch {} }, [format]);

  const genres = useMemo(() => ['any', ...Array.from(new Set(rows.map(r => (r.classification || '').trim()).filter(Boolean))).sort()], [rows]);

  const pool = useMemo(() => rows.filter(r => {
    if (sOnly && (r.tier||'').toUpperCase()!=='S') return false;
    if (genre!=='any' && r.classification !== genre) return false;
    if (format==='YouTube' && !r.youtube) return false;
    if (format==='SoundCloud' && !r.soundcloud) return false;
    if (format==='both' && !(r.youtube && r.soundcloud)) return false;
    return true;
  }), [rows, sOnly, genre, format]);

  const [picks, setPicks] = useState<typeof rows>([]);
  const launch = () => setPicks([...pool].sort(()=>Math.random()-.5).slice(0,3));

  return (
    <section className="container mx-auto max-w-6xl px-6 mt-10 space-y-10">
      <PageTitle title="SUGGESTOR" />

      {/* control panel */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50/60 backdrop-blur p-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 rounded-2xl overflow-hidden">
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="text-xs font-medium tracking-widest text-neutral-500 uppercase" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Genre</div>
            <div className="flex flex-wrap justify-center gap-2">
              {genres.map(g => <Pill key={g} active={genre===g} onClick={()=>setGenre(g)}>{g}</Pill>)}
            </div>
          </div>
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="text-xs font-medium tracking-widest text-neutral-500 uppercase" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Tier</div>
            <div className="flex items-center gap-3">
              <Switch checked={sOnly} onChange={()=>setSOnly(v=>!v)} /><span className="text-sm">S-tier only</span>
            </div>
          </div>
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="text-xs font-medium tracking-widest text-neutral-500 uppercase" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Format</div>
            <span className="relative inline-flex items-center h-9 px-3 rounded-lg border border-neutral-300 bg-white">
              <select value={format} onChange={e=>setFormat(e.target.value as any)} className="appearance-none bg-transparent outline-none text-sm pr-5">
                <option>-</option><option>YouTube</option><option>SoundCloud</option><option>both</option>
              </select>
              <svg width="16" height="16" viewBox="0 0 20 20" className="absolute right-1 pointer-events-none"><path d="M5 7l5 6 5-6" fill="none" stroke="#000" strokeWidth="1.5"/></svg>
            </span>
          </div>
          <div className="p-6 flex items-center justify-center">
            <button onClick={launch} className="inline-flex h-11 px-5 rounded-full bg-[var(--accent)] text-white hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Launch</button>
          </div>
        </div>
      </div>

      {/* results */}
      {picks.length>0 && (
        <div className="grid gap-3">
          {picks.map((r,i)=>(
            <motion.div key={r.set+i} whileHover={{ y: -2 }}
              className="rounded-2xl border border-neutral-200 p-6 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 bg-white">
              <div className="font-medium" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>{r.set}</div>
              <div>{r.artist || r.dj || ""} • <Tag>{lc(r.classification)}</Tag></div>
              <div className="justify-self-start sm:justify-self-end flex gap-2">
                {r.youtube && (<IconButton title="play on YouTube" ariaLabel="play on YouTube" onClick={()=>play(r,'youtube')}><YouTubeIcon/></IconButton>)}
                {r.soundcloud && (<IconButton title="play on SoundCloud" ariaLabel="play on SoundCloud" onClick={()=>play(r,'soundcloud')}><SCIcon/></IconButton>)}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
