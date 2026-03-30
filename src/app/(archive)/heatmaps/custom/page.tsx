'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HeatmapExportRenderer } from '@/components/heatmaps/HeatmapExportRenderer';
import { HeatmapRenderer } from '@/components/heatmaps/HeatmapRenderer';
import { exportHeatmapPdf, exportHeatmapPng } from '@/lib/heatmapExport';
import { Row, loadPapa, norm, slugify } from '@/lib/heatmaps';


export default function CustomHeatmapPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

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
    const Papa = await loadPapa();
    const res = await new Promise<{ meta: { fields?: string[] }; data: Record<string, string>[] }>((resolve) => {
      Papa.parse(text, { header: true, skipEmptyLines: true, complete: resolve });
    });

    const fields = (res.meta.fields || []).map((f: string) => (f || '').trim().toLowerCase());
    const required = ['festival','date','stage','artist','start','end','rating'];
    const missing = required.filter(r => !fields.includes(r));
    if (missing.length) errs.push(`Missing columns: ${missing.join(', ')}`);

    const rawRows = (res.data || []) as Array<Record<string, string>>;
    if (rawRows.length > 300) errs.push('Too many rows. Maximum is 300.');

    const cleanRows: Row[] = [];
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    
    rawRows.forEach((r, idx) => {
      const rowNum = idx + 2;
      const g = (k: string) => (r?.[k] ?? '').toString();

      const festival = norm(g('festival'));
      const date = norm(g('date'));
      const stage = norm(g('stage'));
      const artist = norm(g('artist'));
      const start = norm(g('start'));
      const end = norm(g('end'));
      let rating = norm(g('rating')).toLowerCase();
      const stage_order_raw = g('stage_order');

      if (!festival) errs.push(`Row ${rowNum}: missing festival`);
      if (!date || !dateRe.test(date)) errs.push(`Row ${rowNum}: invalid date (YYYY-MM-DD)`);
      if (!stage) errs.push(`Row ${rowNum}: missing stage`);
      if (!artist) errs.push(`Row ${rowNum}: missing artist`);

      const ns = normalizeTime(start);
      const ne = normalizeTime(end);
      if (!ns || !ne) errs.push(`Row ${rowNum}: invalid time (HH:MM)`);

      if (rating === 'empty') rating = '';
      const allowedRating = ['','nahh','ok','hot','blazing'];
      if (!allowedRating.includes(rating)) errs.push(`Row ${rowNum}: invalid rating`);

      let stage_order: number | undefined = undefined;
      const so = norm(stage_order_raw);
      if (so) {
        const n = Number(so);
        if (Number.isFinite(n)) stage_order = n;
      }

      if (festival && date && stage && artist && ns && ne && allowedRating.includes(rating)) {
        cleanRows.push({ festival, date, stage, stage_order, artist, start: ns, end: ne, rating });
      }
    });

    setErrors(errs);
    if (errs.length === 0) setRows(cleanRows);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrors([]);
    setRows([]);
    setExportError(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      await validateAndParse(text);
    };
    reader.readAsText(file);
  };

  async function handlePngExport() {
    if (!rows.length || !exportRef.current) return;
    setExportError(null);
    setIsExportingPng(true);
    try {
      await exportHeatmapPng(exportRef.current, `${slugify(rows[0].festival)}-heatmap.png`);
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsExportingPng(false);
    }
  }

  async function handlePdfExport() {
    if (!rows.length || !exportRef.current) return;
    setExportError(null);
    setIsExportingPdf(true);
    try {
      await exportHeatmapPdf(exportRef.current, `${slugify(rows[0].festival)}-heatmap.pdf`);
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-24 pt-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <Link 
            href="/heatmaps"
            className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Gallery
          </Link>
          <h1 className="mt-4 text-5xl font-black tracking-tighter text-neutral-900 sm:text-7xl">
            Generator.
          </h1>
          <p className="mt-2 text-lg font-medium text-neutral-500">
            Upload your festival schedule CSV and get a stunning heatmap instantly.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {rows.length > 0 ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  {exportError && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
                      {exportError}
                    </div>
                  )}
                  <HeatmapRenderer
                    groupKey="custom-preview"
                    title={rows[0].festival}
                    date={rows[0].date}
                    rows={rows}
                    pxPerMin={1.2}
                    onExportPng={handlePngExport}
                    onExportPdf={handlePdfExport}
                    isExportingPng={isExportingPng}
                    isExportingPdf={isExportingPdf}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-white p-12 text-center"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-white">
                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-neutral-900 tracking-tight">Ready for your schedule</h3>
                  <p className="mt-2 max-w-xs text-neutral-500 font-medium">
                    Select a CSV file to see your custom heatmap rendered here.
                  </p>
                  <label className="mt-8 cursor-pointer rounded-full bg-neutral-900 px-8 py-4 font-black transition-transform hover:scale-105 text-white shadow-xl">
                    Upload CSV
                    <input type="file" className="hidden" accept=".csv" onChange={onFileChange} />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-xl border border-neutral-100">
              <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">CSV Guide</h4>
              <p className="mt-4 text-sm font-medium text-neutral-600 leading-relaxed">
                Your CSV must include these headers:
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['festival', 'date', 'stage', 'artist', 'start', 'end', 'rating'].map(h => (
                  <span key={h} className="rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-neutral-600">
                    {h}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-xs text-neutral-400 font-medium">
                Tip: Ratings can be <span className="text-blue-500">nahh</span>, <span className="text-yellow-500">ok</span>, <span className="text-orange-500">hot</span>, or <span className="text-red-500">blazing</span>.
              </p>
            </div>

            {errors.length > 0 && (
              <div className="rounded-3xl bg-red-50 p-8 shadow-xl border border-red-100">
                <h4 className="text-sm font-black uppercase tracking-widest text-red-400">Issues found</h4>
                <ul className="mt-4 space-y-2">
                  {errors.slice(0, 5).map((e, i) => (
                    <li key={i} className="text-xs font-bold text-red-700 flex gap-2">
                      <span>•</span> {e}
                    </li>
                  ))}
                  {errors.length > 5 && (
                    <li className="text-xs font-bold text-red-400 italic">
                      + {errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      {rows.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0"
          style={{ left: -20000 }}
        >
          <HeatmapExportRenderer
            ref={exportRef}
            title={rows[0].festival}
            date={rows[0].date}
            rows={rows}
            pxPerMin={1.2}
          />
        </div>
      )}
    </div>
  );
}
