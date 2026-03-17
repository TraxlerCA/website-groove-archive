'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Row,
  COLORS,
  TIME_W,
  TICK_W,
  LABEL_GAP,
  CARD_BORDER,
  SLOT_GAP_PX,
  toMin,
  clamp,
  bucketFromRating,
} from '@/lib/heatmaps';

interface HeatmapRendererProps {
  groupKey: string;
  title: string;
  date: string;
  rows: Row[];
  pxPerMin: number;
  registerRef?: (el: HTMLDivElement | null) => void;
  onExport?: () => void;
  showExport?: boolean;
}

export function HeatmapRenderer({
  groupKey,
  title,
  date,
  rows,
  pxPerMin,
  registerRef,
  onExport,
  showExport = true,
}: HeatmapRendererProps) {
  const stages = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      const ord = Number(r.stage_order ?? 9999);
      map.set(r.stage, Math.min(map.get(r.stage) ?? ord, ord));
    });
    return Array.from(map.entries()).sort((a, b) => a[1] - b[1]).map(([s]) => s);
  }, [rows]);

  // midnight handling with 10:00 cutoff
  const DAY = 24 * 60;
  const NIGHT_CUTOFF_H = 10;           // anything earlier is treated as next day
  const CUTOFF = NIGHT_CUTOFF_H * 60;

  const startMin = React.useCallback((r: Row) => {
    const s = toMin(r.start);
    return s < CUTOFF ? s + DAY : s;
  }, [CUTOFF, DAY]);

  const endMin = React.useCallback((r: Row) => {
    const s = startMin(r);
    let e = toMin(r.end);
    e = e < CUTOFF ? e + DAY : e;
    if (e <= s) e += DAY; // safety for 22:00→01:00 and odd cases
    return e;
  }, [startMin, CUTOFF, DAY]);

  const fmtHour = (mins: number) => {
    const hr = Math.floor((((mins % DAY) + DAY) % DAY) / 60);
    return String(hr).padStart(2, '0') + ':00';
  };

  const minStart = useMemo(() => Math.min(...rows.map(r => startMin(r))), [rows, startMin]);
  const maxEnd   = useMemo(() => Math.max(...rows.map(r => endMin(r))),   [rows, endMin]);
  const totalMin = clamp(Math.max(60, maxEnd - minStart), 60, 20 * 60);
  const heightPx = Math.round(totalMin * pxPerMin);

  const hours = useMemo(() => {
    const s = Math.floor(minStart / 60), e = Math.ceil(maxEnd / 60);
    return Array.from({ length: Math.max(0, e - s + 1) }, (_, i) => (s + i) * 60);
  }, [minStart, maxEnd]);

  return (
    <section aria-labelledby={`h-${groupKey}`} className="w-full">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id={`h-${groupKey}`} className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            {title}
          </h2>
          <p className="text-sm font-medium text-neutral-500">{date}</p>
        </div>
        {showExport && (
          <motion.button
            className="self-start rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-neutral-800 transition-colors"
            onClick={onExport}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 0, scale: 0.98 }}
          >
            Export PNG
          </motion.button>
        )}
      </div>

      <div 
        ref={registerRef} 
        className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xl overflow-x-auto scrollbar-hide"
      >
        {/* legend */}
        <div className="mb-6 flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest text-neutral-500">
          <span className="inline-flex items-center gap-2"><i className="inline-block h-3 w-6 rounded-sm" style={{ backgroundColor: COLORS.nahh }} /> nahh</span>
          <span className="inline-flex items-center gap-2"><i className="inline-block h-3 w-6 rounded-sm" style={{ backgroundColor: COLORS.ok }} /> ok</span>
          <span className="inline-flex items-center gap-2"><i className="inline-block h-3 w-6 rounded-sm" style={{ backgroundColor: COLORS.hot }} /> hot</span>
          <span className="inline-flex items-center gap-2"><i className="inline-block h-3 w-6 rounded-sm" style={{ backgroundColor: COLORS.blazing }} /> blazing</span>
        </div>

        <div className="min-w-[800px]">
          {/* headers */}
          <div className="flex items-stretch">
            <div style={{ width: TIME_W }} />
            <div className="grid w-full gap-0" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
              {stages.map((s, i) => (
                <div
                  key={s}
                  className={`text-center text-sm font-black uppercase tracking-tighter text-neutral-900 border-r border-neutral-200 ${i === stages.length - 1 ? 'border-r-0' : ''} py-2`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* body */}
          <div className="mt-4 flex items-stretch">
            {/* time rail */}
            <div className="relative" style={{ width: TIME_W, height: heightPx }}>
              {hours.map(h => (
                <div
                  key={`tick-${h}`}
                  className="absolute right-0 h-px bg-neutral-200"
                  style={{ top: (h - minStart) * pxPerMin, width: TICK_W }}
                />
              ))}
              {hours.map(h => (
                <div
                  key={`lab-${h}`}
                  className="absolute -translate-y-3 text-sm font-black tabular-nums text-neutral-400"
                  style={{ top: (h - minStart) * pxPerMin, right: TICK_W + LABEL_GAP }}
                >
                  {fmtHour(h)}
                </div>
              ))}
            </div>

            {/* stage area */}
            <div className="relative w-full" style={{ height: heightPx }}>
              <div className="pointer-events-none absolute inset-0">
                {hours.map(h => (
                  <div
                    key={`hline-${h}`}
                    className="absolute left-0 right-0 h-px bg-neutral-100"
                    style={{ top: (h - minStart) * pxPerMin }}
                  />
                ))}
              </div>

              <div className="relative grid h-full gap-0" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
                {stages.map((stage, idx) => {
                  const sets = rows
                    .filter(r => r.stage === stage)
                    .sort((a, b) => startMin(a) - startMin(b));

                  type Ev = { r: Row; i: number; s: number; e: number };
                  const events: Ev[] = sets.map((r, i) => ({ r, i, s: startMin(r), e: endMin(r) }));

                  const clusters: Ev[][] = [];
                  let cur: Ev[] = [];
                  let curEnd = -Infinity;
                  for (const ev of events) {
                    if (!cur.length || ev.s < curEnd) {
                      cur.push(ev);
                      if (ev.e > curEnd) curEnd = ev.e;
                    } else {
                      clusters.push(cur);
                      cur = [ev];
                      curEnd = ev.e;
                    }
                  }
                  if (cur.length) clusters.push(cur);

                  const placement: Record<number, { col: number; cols: number }> = {};
                  for (const cluster of clusters) {
                    const colEnds: number[] = [];
                    type Placed = { idx: number; col: number };
                    const placed: Placed[] = [];
                    for (const ev of cluster) {
                      let col = colEnds.findIndex(end => end <= ev.s);
                      if (col === -1) { colEnds.push(ev.e); col = colEnds.length - 1; }
                      else { colEnds[col] = ev.e; }
                      placed.push({ idx: ev.i, col });
                    }
                    const cols = colEnds.length;
                    for (const p of placed) placement[p.idx] = { col: p.col, cols };
                  }

                  return (
                    <div key={stage} className={`relative border-r border-neutral-100 ${idx === stages.length - 1 ? 'border-r-0' : ''}`}>
                      {sets.map((r, i) => {
                        const s = startMin(r);
                        const e = endMin(r);
                        const naturalTop = (s - minStart) * pxPerMin;
                        const naturalH   = Math.max(32, (e - s) * pxPerMin);
                        const innerH = naturalH * 0.94;
                        const top = naturalTop + (naturalH - innerH) / 2;

                        const bucket = bucketFromRating(r.rating);
                        const bg = bucket ? COLORS[bucket] : COLORS.unrated;
                        const isDark = bucket === 'blazing' || bucket === 'hot' || (bucket === 'nahh');
                        const txt = isDark ? '#FFFFFF' : '#111827';

                        const place = placement[i] || { col: 0, cols: 1 };
                        const n = Math.max(1, place.cols);
                        const c = Math.max(0, Math.min(place.col, n - 1));
                        const width = `calc((100% - ${(n - 1) * SLOT_GAP_PX}px) / ${n})`;
                        const left  = `calc(${c} * (100% - ${(n - 1) * SLOT_GAP_PX}px) / ${n} + ${c * SLOT_GAP_PX}px)`;

                        return (
                          <div key={stage + '-' + i} className="absolute left-1 right-1" style={{ top }}>
                            <div className="relative" style={{ height: innerH }}>
                              <div
                                className={`${CARD_BORDER} absolute inset-y-0 flex flex-col items-center justify-center text-center px-2 transition-all hover:scale-[1.02] hover:shadow-lg z-10`}
                                style={{ left, width, height: '100%', backgroundColor: bg, color: txt }}
                              >
                                <div className="text-[11px] sm:text-[13px] font-black leading-tight truncate w-full">{r.artist}</div>
                                <div className="text-[9px] opacity-70 font-bold">{r.start} - {r.end}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
