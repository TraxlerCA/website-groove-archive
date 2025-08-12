'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import * as htmlToImage from 'html-to-image';

type Rating = 'nahh' | 'ok' | 'hot' | 'blazing' | '';
type Row = {
  festival: string;  // full title to show
  date: string;      // YYYY-MM-DD
  stage: string;
  stage_order?: string | number;
  artist: string;
  start: string;     // HH:MM
  end: string;       // HH:MM
  rating?: string | null;
};

const COLORS = {
  unrated: '#E7E5E4',
  nahh:    '#8AA3FF',
  ok:      '#FEF0B8',
  hot:     '#FF9D2E',
  blazing: '#E7180B',
};

// rails and ticks
const TIME_W = 96;          // width of the left time rail
const TICK_W = 12;          // horizontal tick length inside time rail
const LABEL_GAP = 10;       // space between tick end and time label

const CARD_BORDER = 'border border-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] rounded-md';

const norm = (v?: string) => (v ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const toMin = (t: string) => {
  const s = norm(t);
  const [h, m] = s.split(':').map(n => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const parseDate = (d: string) => Date.parse(norm(d));
const bucketFromRating = (s?: string | null): Rating => {
  const v = norm(s).toLowerCase();
  if (v === 'nahh' || v === 'nah' || v === 'blue') return 'nahh';
  if (v === 'ok'   || v === 'yellow') return 'ok';
  if (v === 'hot'  || v === 'orange') return 'hot';
  if (v === 'blazing' || v === 'red') return 'blazing';
  return '';
};

type Group = { title: string; date: string; rows: Row[]; key: string };

export default function HeatmapsPage() {
  const DEFAULT_CSV =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRexqa-1vfj-JdFSSFUjWycho-00d5rLdS76eBgvCbruyvtcVIIom-VM52SvfuhLg-CeHLRp2I6k5B2/pub?gid=116583245&single=true&output=csv';
  const CSV_URL =
    typeof window !== 'undefined'
      ? new URLSearchParams(location.search).get('csv') || DEFAULT_CSV
      : DEFAULT_CSV;

  const [rows, setRows] = useState<Row[]>([]);
  const [pxPerMin, setPxPerMin] = useState(1.0);
  const [err, setErr] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    Papa.parse<Row>(CSV_URL, {
      download: true, header: true, skipEmptyLines: true,
      complete: (res: ParseResult<Row>) => {
        const clean = (res.data || [])
          .map(r => ({
            festival: norm(r.festival),
            date: norm(r.date),
            stage: norm(r.stage),
            stage_order: Number((r.stage_order as any) ?? 9999),
            artist: norm(r.artist),
            start: norm(r.start),
            end: norm(r.end),
            rating: norm(r.rating || ''),
          }))
          .filter(r => r.festival && r.date && r.stage && r.artist && r.start && r.end);
        setRows(clean);
      }
    });
  }, [CSV_URL]);

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    for (const r of rows) {
      const key = `${r.festival}__${r.date}`;
      if (!map.has(key)) map.set(key, { title: r.festival, date: r.date, rows: [], key });
      map.get(key)!.rows.push(r);
    }
    return Array.from(map.values()).sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [rows]);

  async function exportPng(key: string, title: string) {
    const el = refs.current[key]; if (!el) return;
    setErr(null);
    try {
      const dataUrl = await htmlToImage.toPng(el, {
        pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true, skipFonts: true
      } as any);
      const a = document.createElement('a'); a.href = dataUrl; a.download = `${title.replace(/\s+/g, '_')}.png`; a.click();
    } catch (e: any) { setErr(e?.message || 'Export failed'); console.error(e); }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      {/* 1) header removed */}

      {/* 2) sticky legend */}
      <div className="sticky top-2 z-30 mb-4">
        <div className="inline-flex items-center gap-6 rounded-lg border border-neutral-700 bg-neutral-900/95 px-4 py-2 text-sm text-white shadow-md">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: COLORS.nahh }} />
            nahh
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: COLORS.ok }} />
            ok
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: COLORS.hot }} />
            hot
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: COLORS.blazing }} />
            blazing
          </span>
        </div>
      </div>

      {err && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <div className="space-y-12">
        {groups.map(g => (
          <Heatmap
            key={g.key}
            groupKey={g.key}
            title={g.title}
            date={g.date}
            rows={g.rows}
            pxPerMin={pxPerMin}
            registerRef={el => (refs.current[g.key] = el)}
            onExport={() => exportPng(g.key, `${g.title} ${g.date}`)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs text-neutral-600">
        <label>density</label>
        <input type="range" min={0.6} max={2.0} step={0.05} value={pxPerMin}
               onChange={e => setPxPerMin(parseFloat((e.target as HTMLInputElement).value))}/>
        <span>{pxPerMin.toFixed(2)} px/min</span>
      </div>
    </div>
  );
}

/* one heatmap */
function Heatmap({
  groupKey, title, date, rows, pxPerMin, registerRef, onExport,
}: {
  groupKey: string; title: string; date: string; rows: Row[];
  pxPerMin: number; registerRef: (el: HTMLDivElement | null) => void; onExport: () => void;
}) {
  const stages = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      const ord = Number(r.stage_order ?? 9999);
      map.set(r.stage, Math.min(map.get(r.stage) ?? ord, ord));
    });
    return Array.from(map.entries()).sort((a, b) => a[1] - b[1]).map(([s]) => s);
  }, [rows]);

  const minStart = useMemo(() => Math.min(...rows.map(r => toMin(r.start))), [rows]);
  const maxEnd   = useMemo(() => Math.max(...rows.map(r => toMin(r.end))),   [rows]);
  const totalMin = clamp(Math.max(60, maxEnd - minStart), 60, 16 * 60);
  const heightPx = Math.round(totalMin * pxPerMin);

  const hours = useMemo(() => {
    const s = Math.floor(minStart / 60), e = Math.ceil(maxEnd / 60);
    return Array.from({ length: Math.max(0, e - s + 1) }, (_, i) => (s + i) * 60);
  }, [minStart, maxEnd]);

  return (
    <section aria-labelledby={`h-${groupKey}`}>
      <div className="mb-2 flex items-center justify-between">
        <h2 id={`h-${groupKey}`} className="text-2xl font-semibold tracking-wide text-neutral-900">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{date}</span>
          <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50" onClick={onExport}>
            Export PNG
          </button>
        </div>
      </div>

      {/* wrapper has no background */}
      <div ref={registerRef} className="rounded-xl border border-neutral-200 p-4">
        {/* headers with vertical black dividers */}
        <div className="flex items-stretch">
          <div style={{ width: TIME_W }} />
          <div className="grid w-full gap-0" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
            {stages.map((s, i) => (
              <div key={s}
                   className={`text-center text-[13px] font-medium tracking-wide text-neutral-700 border-r border-black ${i === stages.length - 1 ? 'border-r-0' : ''} py-1`}>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="mt-2 flex items-stretch">
          {/* time rail with ticks and labels moved left from the ticks */}
          <div className="relative" style={{ width: TIME_W, height: heightPx }}>
            {hours.map(h => (
              <div key={`tick-${h}`} className="absolute right-0 h-px bg-black"
                   style={{ top: (h - minStart) * pxPerMin, width: TICK_W }} />
            ))}
            {hours.map(h => (
              <div key={`lab-${h}`} className="absolute -translate-y-3 text-[16px] font-bold tabular-nums text-neutral-900"
                   style={{ top: (h - minStart) * pxPerMin, right: TICK_W + LABEL_GAP }}>
                {String(Math.floor(h / 60)).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* stage area with global grid lines */}
          <div className="relative w-full" style={{ height: heightPx }}>
            {/* black horizontal lines across all stages */}
            <div className="pointer-events-none absolute inset-0">
              {hours.map(h => (
                <div key={`hline-${h}`} className="absolute left-0 right-0 h-px bg-black"
                     style={{ top: (h - minStart) * pxPerMin }} />
              ))}
            </div>

            {/* columns with black vertical separators */}
            <div className="relative grid h-full gap-0" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
              {stages.map((stage, idx) => {
                const sets = rows.filter(r => r.stage === stage).sort((a, b) => toMin(a.start) - toMin(b.start));
                return (
                  <div key={stage} className={`relative border-r border-black ${idx === stages.length - 1 ? 'border-r-0' : ''}`}>
                    {sets.map((r, i) => {
                      const naturalTop = (toMin(r.start) - minStart) * pxPerMin;
                      const naturalH   = Math.max(28, (toMin(r.end) - toMin(r.start)) * pxPerMin);
                      const innerH = naturalH * 0.95;                                  // 95% height
                      const top = naturalTop + (naturalH - innerH) / 2;

                      const bucket = bucketFromRating(r.rating);
                      const bg = bucket ? COLORS[bucket] : COLORS.unrated;
                      const txt = (bucket === 'ok' || bucket === '') ? '#111827' : '#FFFFFF';

                      return (
                        <div key={stage + '-' + i} className="absolute left-2 right-2" style={{ top }}>
                          <div className={`${CARD_BORDER} flex items-center justify-center text-center px-2`}
                               style={{ height: innerH, backgroundColor: bg, color: txt }}>
                            <div className="text-[13px] leading-snug">{r.artist}</div>
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
    </section>
  );
}
