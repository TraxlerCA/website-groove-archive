'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Row,
  COLORS,
  TIME_W,
  HEADER_H,
  TICK_W,
  LABEL_GAP,
  CARD_BORDER,
  SLOT_GAP_PX,
  toMin,
  clamp,
  bucketFromRating,
  loadHtmlToImage,
  slugify,
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
  const [isSnapshotting, setIsSnapshotting] = React.useState(false);
  const [snapshotUrl, setSnapshotUrl] = React.useState<string | null>(null);
  const [now, setNow] = React.useState<number | null>(null);
  const [scale, setScale] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const updateNow = () => {
      const d = new Date();
      const todayStr = d.toISOString().split('T')[0];
      if (todayStr === date) {
        const mins = d.getHours() * 60 + d.getMinutes();
        const NIGHT_CUTOFF_H = 10;
        const CUTOFF = NIGHT_CUTOFF_H * 60;
        const DAY = 24 * 60;
        setNow(mins < CUTOFF ? mins + DAY : mins);
      } else {
        setNow(null);
      }
    };
    updateNow();
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, [date]);

  const sectionRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const updateScale = () => {
      if (!sectionRef.current) return;
      const sw = window.innerWidth;
      if (sw >= 640) {
        setIsMobile(false);
        setScale(1);
      } else {
        setIsMobile(true);
        const availableW = sectionRef.current.clientWidth;
        setScale(availableW / 1000);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const stages = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      const ord = Number(r.stage_order ?? 9999);
      map.set(r.stage, Math.min(map.get(r.stage) ?? ord, ord));
    });
    return Array.from(map.entries()).sort((a, b) => a[1] - b[1]).map(([s]) => s);
  }, [rows]);

  const DAY = 24 * 60;
  const NIGHT_CUTOFF_H = 10;
  const CUTOFF = NIGHT_CUTOFF_H * 60;

  const startMin = React.useCallback((r: Row) => {
    const s = toMin(r.start);
    return s < CUTOFF ? s + DAY : s;
  }, [CUTOFF, DAY]);

  const endMin = React.useCallback((r: Row) => {
    const s = startMin(r);
    let e = toMin(r.end);
    e = e < CUTOFF ? e + DAY : e;
    if (e <= s) e += DAY;
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

  const handleSnapshot = async () => {
    if (!registerRef) return;
    setIsSnapshotting(true);
    try {
      const htmlToImage = await loadHtmlToImage();
      const el = sectionRef.current;
      if (!el) return;
      
      const dataUrl = await htmlToImage.toPng(el, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      setSnapshotUrl(dataUrl);
    } catch (e) {
      console.error('Snapshot failed:', e);
    } finally {
      setIsSnapshotting(false);
    }
  };

  const renderHeadersContent = () => (
    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
      {stages.map((s, i) => (
        <div
          key={s}
          className={`flex items-center justify-center text-center text-[11px] sm:text-sm font-black uppercase tracking-tighter text-black border-r border-neutral-100 ${i === stages.length - 1 ? 'border-r-0' : ''} px-1 sm:px-2`}
        >
          {s}
        </div>
      ))}
    </div>
  );

  const renderTimeRailContent = () => (
    <div className="relative w-full h-full">
      {hours.map(h => (
        <React.Fragment key={`time-${h}`}>
          <div
            className="absolute right-0 h-px bg-neutral-100"
            style={{ top: (h - minStart) * pxPerMin, width: TICK_W }}
          />
          <div
            className="absolute -translate-y-2.5 text-[10px] sm:text-sm font-black tabular-nums text-black"
            style={{ top: (h - minStart) * pxPerMin, left: isMobile ? 4 : 8 }}
          >
            {fmtHour(h)}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const renderSetsContent = () => (
    <div className="relative w-full" style={{ height: heightPx }}>
      {/* h-lines */}
      <div className="pointer-events-none absolute inset-0">
        {hours.map(h => (
          <div
            key={`hline-${h}`}
            className="absolute left-0 right-0 h-px bg-neutral-50/50"
            style={{ top: (h - minStart) * pxPerMin }}
          />
        ))}
        {/* Now Indicator line */}
        {now !== null && now >= minStart && now <= maxEnd && (
          <div 
            className="absolute left-0 right-0 z-40 flex items-center"
            style={{ top: (now - minStart) * pxPerMin }}
          >
            <div className="h-px w-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.4)]" />
            <div className="absolute -left-1 h-2.5 w-2.5 rounded-full border border-white bg-red-600 shadow-sm" />
          </div>
        )}
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
            <div key={stage} className={`relative border-r border-neutral-100/30 ${idx === stages.length - 1 ? 'border-r-0' : ''}`}>
              {sets.map((r, i) => {
                const s = startMin(r);
                const e = endMin(r);
                const naturalTop = (s - minStart) * pxPerMin;
                const naturalH   = Math.max(30, (e - s) * pxPerMin);
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
                  <div key={stage + '-' + i} className="absolute left-1.5 right-1.5" style={{ top }}>
                    <div className="relative" style={{ height: innerH }}>
                      <div
                        className={`${CARD_BORDER} absolute inset-y-0 flex flex-col items-center justify-center text-center px-1 transition-all z-10 overflow-hidden`}
                        style={{ left, width, height: '100%', backgroundColor: bg, color: txt }}
                      >
                        <div className="text-[11px] sm:text-[13px] font-black leading-[1.1] truncate w-full tracking-tighter">
                          {r.artist}
                        </div>
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
  );

  return (
    <section ref={sectionRef} aria-labelledby={`h-${groupKey}`} className="w-full">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id={`h-${groupKey}`} className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {showExport && !isSnapshotting && (
            <motion.button
              className="hidden sm:flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-neutral-800 transition-colors"
              onClick={onExport}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PNG
            </motion.button>
          )}
        </div>
      </div>

      <div className="bg-white">
        {/* Legend - Static Header */}
        <div className="mb-10 flex flex-wrap items-center gap-6 sm:gap-10 px-4 sm:px-0">
          <div className="flex items-center gap-3">
            <div className="h-5 w-10 border border-neutral-100" style={{ backgroundColor: COLORS.nahh }} />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-neutral-900">nahh</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-10 border border-neutral-100" style={{ backgroundColor: COLORS.ok }} />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-neutral-900">ok</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-10 border border-neutral-100" style={{ backgroundColor: COLORS.hot }} />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-neutral-900">hot</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-10 border border-neutral-100" style={{ backgroundColor: COLORS.blazing }} />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-neutral-900">blazing</span>
          </div>
        </div>

        {/* Unified Sticky Heatmap Container */}
        <div 
          className="relative rounded-xl sm:rounded-3xl border border-neutral-200 bg-white shadow-2xl overflow-auto scrollbar-hide touch-pan-x touch-pan-y"
          style={{ maxHeight: '85vh' }}
        >
          <div className="relative" style={{ minWidth: Math.max(600, stages.length * (isMobile ? 120 : 180)) }}>
            {/* Top Header - Stages */}
            <div className="sticky top-0 z-30 flex items-stretch bg-white/95 backdrop-blur-md border-b border-neutral-100 h-[50px] sm:h-[60px]">
              {/* Top-Left intersection spacer */}
              <div 
                className="sticky left-0 z-40 bg-white border-r border-neutral-100 shrink-0" 
                style={{ width: isMobile ? 45 : 80 }} 
              />
              <div className="flex-1">
                {renderHeadersContent()}
              </div>
            </div>

            <div className="relative flex items-stretch">
              {/* Left Column - Time */}
              <div 
                className="sticky left-0 z-20 bg-white/95 backdrop-blur-sm border-r border-neutral-100 shrink-0" 
                style={{ width: isMobile ? 45 : 80, height: heightPx }}
              >
                {renderTimeRailContent()}
              </div>
              
              {/* Main Grid Content */}
              <div className="flex-1">
                {renderSetsContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Lightbox */}
      <AnimatePresence>
        {snapshotUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4 sm:p-10 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="text-white">
                <h3 className="text-xl font-black tracking-tight">{title}</h3>
                <p className="text-sm font-medium text-neutral-400">Pinch or double-tap to zoom</p>
              </div>
              <button 
                onClick={() => setSnapshotUrl(null)}
                className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="relative flex-1 overflow-auto rounded-2xl bg-white/5 cursor-zoom-in">
              <motion.img 
                src={snapshotUrl} 
                alt="Heatmap snapshot"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="min-h-full min-w-full object-contain"
                drag
                dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
              />
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <a 
                href={snapshotUrl} 
                download={`${slugify(title)}-poster.png`}
                className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-black shadow-2xl active:scale-95 transition-transform"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save to Photos
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
