'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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

const norm = (v?: string | null) => (v ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const toMin = (t: string) => {
  const s = norm(t);
  const [h, m] = s.split(':').map(n => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const parseDate = (d: string) => Date.parse(norm(d));
const bucketFromRating = (s?: string | null): Rating => {
  const v = norm(s).toLowerCase();
  if (v === 'empty') return '';
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

  // curated data fetched from the default CSV (existing behavior)
  const [rows, setRows] = useState<Row[]>([]);
  // user-provided preview rows (ephemeral)
  const [userRows, setUserRows] = useState<Row[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
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
            stage_order: Number(r.stage_order ?? 9999),
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

  const userGroups: Group[] = useMemo(() => {
    if (!userRows.length) return [];
    const map = new Map<string, Group>();
    for (const r of userRows) {
      const key = `${r.festival}__${r.date}`;
      if (!map.has(key)) map.set(key, { title: r.festival, date: r.date, rows: [], key });
      map.get(key)!.rows.push(r);
    }
    return Array.from(map.values()).sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [userRows]);

  const slugify = (s: string) => s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  async function exportPng(key: string, title: string) {
    const el = refs.current[key]; if (!el) return;
    setErr(null);
    try {
      const dataUrl = await htmlToImage.toPng(el, {
        pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true, skipFonts: true
      });
      try { (window as any).plausible?.('heatmap_download_png'); } catch {}
      const a = document.createElement('a'); a.href = dataUrl; a.download = `${slugify(title)}-heatmap.png`; a.click();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Export failed'); console.error(e); }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <CreateHeatmapModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onApply={(rows) => { setUserRows(rows); setUploadOpen(false); }}
      />
      {/* 1) entry: create your own heatmap */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-wide text-neutral-900">Heatmaps</h1>
        <button
          className="rounded-md bg-neutral-900 px-4 py-2 text-white shadow hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          onClick={() => setUploadOpen(true)}
        >
          Create your own heatmap
        </button>
      </div>

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

      {/* user preview above curated heatmaps */}
      {userGroups.length > 0 && (
        <div className="mb-10 space-y-8">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-wide text-neutral-900">Your preview</h2>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                onClick={() => setUserRows([])}
              >
                Clear preview
              </button>
            </div>
          </div>
          {userGroups.map(g => (
            <Heatmap
              key={'user__' + g.key}
              groupKey={'user__' + g.key}
              title={g.title}
              date={g.date}
              rows={g.rows}
              pxPerMin={pxPerMin}
              registerRef={el => (refs.current['user__' + g.key] = el)}
              onExport={() => exportPng('user__' + g.key, `${g.title}-${g.date}`)}
            />
          ))}
        </div>
      )}

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
            onExport={() => exportPng(g.key, `${g.title}-${g.date}`)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs text-neutral-600">
        <label>density</label>
        <input
          type="range"
          min={0.6}
          max={2.0}
          step={0.05}
          value={pxPerMin}
          onChange={e => setPxPerMin(parseFloat((e.target as HTMLInputElement).value))}
        />
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

  // midnight handling with 10:00 cutoff
  const DAY = 24 * 60;
  const NIGHT_CUTOFF_H = 10;           // anything earlier is treated as next day
  const CUTOFF = NIGHT_CUTOFF_H * 60;

  const startMin = (r: Row) => {
    const s = toMin(r.start);
    return s < CUTOFF ? s + DAY : s;
  };
  const endMin = (r: Row) => {
    const s = startMin(r);
    let e = toMin(r.end);
    e = e < CUTOFF ? e + DAY : e;
    if (e <= s) e += DAY; // safety for 22:00→01:00 and odd cases
    return e;
  };
  const fmtHour = (mins: number) => {
    const hr = Math.floor((((mins % DAY) + DAY) % DAY) / 60);
    return String(hr).padStart(2, '0') + ':00';
  };

  const minStart = useMemo(() => Math.min(...rows.map(r => startMin(r))), [rows]);
  const maxEnd   = useMemo(() => Math.max(...rows.map(r => endMin(r))),   [rows]);
  const totalMin = clamp(Math.max(60, maxEnd - minStart), 60, 20 * 60);
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
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
            onClick={onExport}
          >
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
              <div
                key={s}
                className={`text-center text-[13px] font-medium tracking-wide text-neutral-700 border-r border-black ${i === stages.length - 1 ? 'border-r-0' : ''} py-1`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="mt-2 flex items-stretch">
          {/* time rail with ticks and labels */}
          <div className="relative" style={{ width: TIME_W, height: heightPx }}>
            {hours.map(h => (
              <div
                key={`tick-${h}`}
                className="absolute right-0 h-px bg-black"
                style={{ top: (h - minStart) * pxPerMin, width: TICK_W }}
              />
            ))}
            {hours.map(h => (
              <div
                key={`lab-${h}`}
                className="absolute -translate-y-3 text-[16px] font-bold tabular-nums text-neutral-900"
                style={{ top: (h - minStart) * pxPerMin, right: TICK_W + LABEL_GAP }}
              >
                {fmtHour(h)}
              </div>
            ))}
          </div>

          {/* stage area with global grid lines */}
          <div className="relative w-full" style={{ height: heightPx }}>
            {/* black horizontal lines across all stages */}
            <div className="pointer-events-none absolute inset-0">
              {hours.map(h => (
                <div
                  key={`hline-${h}`}
                  className="absolute left-0 right-0 h-px bg-black"
                  style={{ top: (h - minStart) * pxPerMin }}
                />
              ))}
            </div>

            {/* columns with black vertical separators */}
            <div className="relative grid h-full gap-0" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
              {stages.map((stage, idx) => {
                const sets = rows
                  .filter(r => r.stage === stage)
                  .sort((a, b) => startMin(a) - startMin(b));

                return (
                  <div key={stage} className={`relative border-r border-black ${idx === stages.length - 1 ? 'border-r-0' : ''}`}>
                    {sets.map((r, i) => {
                      const s = startMin(r);
                      const e = endMin(r);
                      const naturalTop = (s - minStart) * pxPerMin;
                      const naturalH   = Math.max(28, (e - s) * pxPerMin);
                      const innerH = naturalH * 0.95;                  // 95% height
                      const top = naturalTop + (naturalH - innerH) / 2;

                      const bucket = bucketFromRating(r.rating);
                      const bg = bucket ? COLORS[bucket] : COLORS.unrated;
                      const txt = (bucket === 'ok' || bucket === '') ? '#111827' : '#FFFFFF';

                      return (
                        <div key={stage + '-' + i} className="absolute left-2 right-2" style={{ top }}>
                          <div
                            className={`${CARD_BORDER} flex items-center justify-center text-center px-2`}
                            style={{ height: innerH, backgroundColor: bg, color: txt }}
                          >
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

/* Upload modal */
function CreateHeatmapModal({
  open, onClose, onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (rows: Row[]) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [csvText, setCsvText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [parsedRows, setParsedRows] = useState<Row[] | null>(null);

  // focus trap + esc close
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    ) || []).filter(el => !el.hasAttribute('disabled'));
    const first = () => focusables()[0];
    const last = () => focusables()[focusables().length - 1];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const f = focusables(); if (!f.length) return;
        const current = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (current === f[0] || !dialog?.contains(current)) { e.preventDefault(); last()?.focus(); }
        } else {
          if (current === f[f.length - 1] || !dialog?.contains(current)) { e.preventDefault(); first()?.focus(); }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    // initial focus
    setTimeout(() => first()?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  const downloadTemplate = useCallback(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const tmpl = [
      ['festival','date','stage','stage_order','artist','start','end','rating'].join(','),
      [`My Festival`,`${yyyy}-${mm}-${dd}`,`Main Stage`,`1`,`Artist A`,`22:30`,`23:45`,`hot`].join(','),
      [`My Festival`,`${yyyy}-${mm}-${dd}`,`Second Stage`,`2`,`Artist B`,`00:15`,`01:00`,`ok`].join(','),
    ].join('\n');
    const blob = new Blob([tmpl], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'heatmap-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const normalizeTime = (t: string) => {
    const s = (t || '').trim();
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hh = String(Math.max(0, Math.min(29, parseInt(m[1], 10)))).padStart(2, '0');
    const mm = String(Math.max(0, Math.min(59, parseInt(m[2], 10)))).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const validateAndParse = useCallback(async (text: string) => {
    const errs: string[] = [];
    const bytes = new Blob([text]).size;
    if (bytes > 1_000_000) errs.push('File is larger than 1 MB.');

    const res = await new Promise<ParseResult<any>>((resolve) => {
      Papa.parse(text, { header: true, skipEmptyLines: true, complete: resolve });
    });

    const fields = (res.meta.fields || []).map(f => (f || '').trim().toLowerCase());
    const required = ['festival','date','stage','artist','start','end','rating'];
    const missing = required.filter(r => !fields.includes(r));
    if (missing.length) errs.push(`Missing required columns: ${missing.join(', ')}`);

    const rawRows = (res.data || []) as any[];
    if (rawRows.length > 200) errs.push('Too many rows. Maximum is 200.');

    const cleanRows: Row[] = [];
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    rawRows.forEach((r, idx) => {
      const rowNum = idx + 2; // header is row 1
      const g = (k: string) => (r?.[k] ?? '').toString();

      const festival = norm(g('festival'));
      const date = norm(g('date'));
      const stage = norm(g('stage'));
      const artist = norm(g('artist'));
      const start = norm(g('start'));
      const end = norm(g('end'));
      let rating = norm(g('rating')).toLowerCase();
      const stage_order_raw = g('stage_order');

      if (!festival) errs.push(`Row ${rowNum} is missing festival.`);
      if (!date || !dateRe.test(date)) errs.push(`Row ${rowNum} has an invalid date. Use YYYY-MM-DD like 2025-07-31.`);
      if (!stage) errs.push(`Row ${rowNum} is missing stage.`);
      if (!artist) errs.push(`Row ${rowNum} is missing artist.`);

      const ns = normalizeTime(start);
      const ne = normalizeTime(end);
      if (!ns) errs.push(`Row ${rowNum} has an invalid time. Use HH:MM like 23:45.`);
      if (!ne) errs.push(`Row ${rowNum} has an invalid time. Use HH:MM like 23:45.`);

      if (rating === 'empty') rating = '';
      const allowedRating = ['','nahh','ok','hot','blazing'];
      if (!allowedRating.includes(rating)) errs.push(`Row ${rowNum} has an invalid rating. Use nahh|ok|hot|blazing|empty.`);

      let stage_order: number | undefined = undefined;
      const so = norm(stage_order_raw);
      if (so) {
        const n = Number(so);
        if (!Number.isFinite(n)) errs.push(`Row ${rowNum} has an invalid stage_order. Use a number like 1, 2, 3.`);
        else stage_order = n;
      }

      if (festival && date && stage && artist && ns && ne && allowedRating.includes(rating)) {
        cleanRows.push({ festival, date, stage, stage_order, artist, start: ns, end: ne, rating });
      }
    });

    setErrors(errs);
    if (errs.length) { setParsedRows(null); return null; }
    setParsedRows(cleanRows);
    return cleanRows;
  }, []);

  const onFile = useCallback(async (file: File) => {
    setBusy(true); setErrors([]); setParsedRows(null);
    try {
      if (file.size > 1_000_000) { setErrors(['File is larger than 1 MB.']); return; }
      const text = await file.text();
      setCsvText(text);
      await validateAndParse(text);
      // optional analytics
      try { (window as any).plausible?.('heatmap_upload_success'); } catch {}
    } finally { setBusy(false); }
  }, [validateAndParse]);

  const onPasteParse = useCallback(async () => {
    setBusy(true); setErrors([]); setParsedRows(null);
    try {
      await validateAndParse(csvText);
      try { (window as any).plausible?.('heatmap_upload_success'); } catch {}
    } finally { setBusy(false); }
  }, [csvText, validateAndParse]);

  const apply = useCallback(() => {
    if (!parsedRows || parsedRows.length === 0) return;
    onApply(parsedRows);
    onClose();
  }, [parsedRows, onApply, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog" aria-modal="true" aria-labelledby="csv-title" aria-describedby="csv-desc"
        className="absolute inset-x-0 top-6 mx-auto w-[min(800px,92vw)] rounded-xl border border-neutral-200 bg-white p-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="csv-title" className="text-lg font-semibold tracking-wide text-neutral-900">Create your own heatmap</h2>
            <p id="csv-desc" className="text-sm text-neutral-600">
              Upload a CSV or paste its contents. Required columns: festival, date (YYYY-MM-DD), stage, artist, start (HH:MM), end (HH:MM), rating (nahh|ok|hot|blazing|empty).
            </p>
          </div>
          <button className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50" onClick={downloadTemplate}>Download CSV template</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 p-3">
            <label className="mb-2 block text-sm font-medium text-neutral-800">Upload CSV file</label>
            <input
              type="file" accept=".csv,text/csv" onChange={e => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onFile(f); }}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:hover:bg-neutral-50"
            />
            <p className="mt-2 text-xs text-neutral-500">Max 1 MB, 200 rows. Delimiter , or ; supported.</p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-3">
            <label htmlFor="csv-text" className="mb-2 block text-sm font-medium text-neutral-800">Or paste CSV text</label>
            <textarea id="csv-text" value={csvText} onChange={e => setCsvText(e.target.value)} rows={7}
              className="w-full resize-y rounded-md border border-neutral-300 p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              placeholder="festival,date,stage,stage_order,artist,start,end,rating\nMy Festival,2025-09-01,Main Stage,1,Artist A,22:30,23:45,hot"
            />
            <div className="mt-2 flex items-center gap-2">
              <button className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50" onClick={onPasteParse} disabled={busy}>Parse</button>
              {busy && <span className="text-xs text-neutral-500">Parsing…</span>}
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <ul className="list-disc pl-5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {parsedRows && errors.length === 0 && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Looks good! Parsed {parsedRows.length} rows. Click “Add preview” to render above.
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50" onClick={onClose}>Cancel</button>
          <button
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={apply}
            disabled={!parsedRows || !!errors.length}
          >
            Add preview
          </button>
        </div>
      </div>
    </div>
  );
}
