'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeatmaps } from '@/hooks/useHeatmaps';
import { HeatmapExportRenderer } from '@/components/heatmaps/HeatmapExportRenderer';
import { HeatmapRenderer } from '@/components/heatmaps/HeatmapRenderer';
import { exportHeatmapPng } from '@/lib/heatmapExport';
import { slugify } from '@/lib/heatmaps';

export default function HeatmapDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { getBySlug, loading, error } = useHeatmaps();
  const heatmap = getBySlug(slug);
  
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  async function handlePngExport() {
    if (!heatmap || !exportRef.current) return;
    setExportError(null);
    setIsExportingPng(true);
    try {
      await exportHeatmapPng(exportRef.current, `${slugify(heatmap.title)}-heatmap.png`);
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsExportingPng(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      </div>
    );
  }

  if (error || !heatmap) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-4xl font-black text-neutral-900 tracking-tighter">Heatmap not found</h1>
        <p className="mt-4 text-neutral-500">We couldn&apos;t find the heatmap you&apos;re looking for.</p>
        <Link 
          href="/heatmaps"
          className="mt-8 inline-block rounded-full bg-neutral-900 px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
        >
          Back to all heatmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-16 pt-4 sm:pb-20 sm:pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between sm:mb-8">
          <Link 
            href="/heatmaps"
            className="group flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.26em] text-neutral-400 transition-colors hover:text-neutral-900 sm:gap-2 sm:text-sm sm:tracking-widest"
          >
            <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Gallery
          </Link>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {exportError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
                {exportError}
              </div>
            )}

            <HeatmapRenderer
              groupKey={heatmap.key}
              title={heatmap.title}
              date={heatmap.date}
              rows={heatmap.rows}
              pxPerMin={1.2}
              onExportPng={handlePngExport}
              isExportingPng={isExportingPng}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {heatmap && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0"
          style={{ left: -20000 }}
        >
          <HeatmapExportRenderer
            ref={exportRef}
            title={heatmap.title}
            date={heatmap.date}
            rows={heatmap.rows}
            pxPerMin={1.2}
          />
        </div>
      )}
    </div>
  );
}
