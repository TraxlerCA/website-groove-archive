'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeatmaps } from '@/hooks/useHeatmaps';
import { HeatmapRenderer } from '@/components/heatmaps/HeatmapRenderer';
import { loadHtmlToImage, slugify } from '@/lib/heatmaps';

export default function HeatmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { getBySlug, loading, error } = useHeatmaps();
  const heatmap = getBySlug(slug);
  
  const [exportError, setExportError] = useState<string | null>(null);
  const heatmapRef = useRef<HTMLDivElement | null>(null);

  async function handleExport() {
    if (!heatmap || !heatmapRef.current) return;
    setExportError(null);
    try {
      const htmlToImage = await loadHtmlToImage();
      const dataUrl = await htmlToImage.toPng(heatmapRef.current, {
        pixelRatio: 2, 
        backgroundColor: '#ffffff', 
        cacheBust: true, 
        skipFonts: true
      });
      
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${slugify(heatmap.title)}-heatmap.png`;
      a.click();
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
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
    <div className="min-h-screen bg-neutral-50/50 pb-20 pt-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/heatmaps"
            className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Gallery
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block rounded-full bg-neutral-200 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-neutral-600">
              {heatmap.rows.length} Artists
            </span>
          </div>
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
              registerRef={(el) => (heatmapRef.current = el)}
              onExport={handleExport}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
