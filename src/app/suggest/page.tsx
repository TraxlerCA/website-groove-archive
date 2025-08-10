// src/app/suggest/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageTitle, CTA, Toggle, TierBadge, CopyBtn } from '@/components/ui';
import Thumb from '@/components/Thumb';
import type { Row } from '@/lib/types';
import { copyToClipboard, lc } from '@/lib/utils';
import { usePlayer } from '@/context/PlayerProvider';
import { useRows } from '@/lib/useRows';

function ControlCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-widest opacity-70 mb-2">{label}</div>
      {children}
    </div>
  );
}

export default function SuggestPage() {
  const { rows } = useRows();

  // default values during SSR, then hydrate from localStorage on mount
  const [levelSOnly, setLevelSOnly] = useState<boolean>(false);
  const [genre, setGenre] = useState<string>('any');
  const [medium, setMedium] = useState<'any' | 'youtube' | 'soundcloud'>('any');

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const s = localStorage.getItem('s_level');
      const g = localStorage.getItem('s_genre');
      const m = localStorage.getItem('s_medium') as 'any' | 'youtube' | 'soundcloud' | null;
      if (s != null) setLevelSOnly(s === '1');
      if (g) setGenre(g);
      if (m === 'any' || m === 'youtube' || m === 'soundcloud') setMedium(m);
    } catch {}
  }, []);

  // persist changes client-side
  useEffect(() => { try { localStorage.setItem('s_level', levelSOnly ? '1' : '0'); } catch {} }, [levelSOnly]);
  useEffect(() => { try { localStorage.setItem('s_genre', genre); } catch {} }, [genre]);
  useEffect(() => { try { localStorage.setItem('s_medium', medium); } catch {} }, [medium]);

  const [suggestions, setSuggestions] = useState<Row[]>([]);
  const [attempted, setAttempted] = useState(false);
  const { play } = usePlayer();

  const genres = useMemo(
    () => Array.from(new Set(rows.map(r => (r.classification || '').trim()))).filter(Boolean).sort(),
    [rows]
  );

  const filtered = useMemo(() => rows.filter(r => {
    if (levelSOnly && (r.tier || '').toUpperCase() !== 'S') return false;
    if (genre !== 'any' && r.classification !== genre) return false;
    if (medium === 'youtube' && !r.youtube) return false;
    if (medium === 'soundcloud' && !r.soundcloud) return false;
    return true;
  }), [rows, levelSOnly, genre, medium]);

  const suggest = () => {
    setAttempted(true);
    const servedKey = 'served_recent_v1';
    let served: string[] = [];
    try { served = JSON.parse(localStorage.getItem(servedKey) || '[]'); } catch {}
    const list = filtered
      .map(r => ({
        r,
        w: (r.tier?.toUpperCase() === 'S' ? 3 : 1)
          + (genre !== 'any' && r.classification === genre ? 2 : 0)
          + (medium === 'any' ? 0 : (medium === 'youtube' && r.youtube ? 2 : 0) + (medium === 'soundcloud' && r.soundcloud ? 2 : 0)),
      }))
      .filter(({ r }) => !served.includes(r.set));

    const picks: Row[] = [];
    for (let i = 0; i < 3 && list.length; i++) {
      const total = list.reduce((s, it) => s + it.w, 0);
      let t = Math.random() * total, idx = 0;
      while (t > 0 && idx < list.length) { t -= list[idx].w; idx++; }
      const chosen = list[Math.max(0, idx - 1)].r;
      picks.push(chosen);
      const at = list.findIndex(x => x.r.set === chosen.set);
      if (at >= 0) list.splice(at, 1);
    }
    setSuggestions(picks);
    try { localStorage.setItem(servedKey, JSON.stringify([...served, ...picks.map(p => p.set)].slice(-50))); } catch {}
  };

  const reshuffle = () => suggest();
  const openRow = (row: Row) => play(row, medium === 'any' ? undefined : medium);

  return (
    <section className="relative z-20 min-h-screen px-6 md:px-10 pt-28 pb-14">
      <PageTitle title="suggest me a set" />
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        <ControlCard label="level">
          <div className="flex gap-2">
            <Toggle active={levelSOnly} onClick={() => setLevelSOnly(true)}>S only</Toggle>
            <Toggle active={!levelSOnly} onClick={() => setLevelSOnly(false)}>any</Toggle>
          </div>
        </ControlCard>
        <ControlCard label="genre">
          <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-[var(--ash)]/70 border border-white/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ice)]/40">
            <option value="any">any</option>
            {genres.map(g => (<option key={g} value={g} className="bg-[var(--coal)]">{g}</option>))}
          </select>
        </ControlCard>
        <ControlCard label="medium">
          <div className="flex gap-2 flex-wrap">
            {(['any', 'youtube', 'soundcloud'] as const).map(m => (
              <Toggle key={m} active={medium === m} onClick={() => setMedium(m)}>{m}</Toggle>
            ))}
          </div>
        </ControlCard>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <CTA label="suggest!" onClick={suggest} variant="primary" />
      </div>

      {attempted && (
        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-sm uppercase tracking-widest opacity-70">suggestions</h3>
          <CTA label="reshuffle" onClick={reshuffle} variant="ghost" />
        </div>
      )}

      {attempted && (suggestions.length > 0 ? (
        <div className="mt-3 grid md:grid-cols-3 gap-4">
          {suggestions.map(s => (
            <motion.div key={s.set} whileHover={{ y: -3 }} className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 overflow-hidden group" onClick={() => openRow(s)}>
              <Thumb row={s} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{s.set}</div>
                    <div className="text-xs opacity-70 capitalize">{lc(s.classification)}</div>
                  </div>
                  <TierBadge tier={s.tier} />
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {s.youtube && (
                    <>
                      <a className="btn-secondary" href={s.youtube} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>youtube</a>
                      <CopyBtn onClick={e => { e.stopPropagation(); copyToClipboard(s.youtube!); }} />
                    </>
                  )}
                  {s.soundcloud && (
                    <>
                      <a className="btn-secondary" href={s.soundcloud} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>soundcloud</a>
                      <CopyBtn onClick={e => { e.stopPropagation(); copyToClipboard(s.soundcloud!); }} />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="opacity-70 mt-4">no matches. adjust filters and press suggest!</div>
      ))}
    </section>
  );
}
