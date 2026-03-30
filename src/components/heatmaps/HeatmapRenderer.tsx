'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  Row,
  COLORS,
  TICK_W,
  CARD_BORDER,
  SLOT_GAP_PX,
} from '@/lib/heatmaps';
import {
  computeHeatmapLayout,
  formatHeatmapHour,
  getHeatmapNow,
} from '@/lib/heatmapLayout';

interface HeatmapRendererProps {
  groupKey: string;
  title: string;
  date: string;
  rows: Row[];
  pxPerMin: number;
  registerRef?: (el: HTMLDivElement | null) => void;
  onExport?: () => void;
  onExportPng?: () => void;
  onExportPdf?: () => void;
  showExport?: boolean;
  isExportingPng?: boolean;
  isExportingPdf?: boolean;
}

export function HeatmapRenderer({
  groupKey,
  title,
  date,
  rows,
  pxPerMin,
  registerRef,
  onExport,
  onExportPng,
  onExportPdf,
  showExport = true,
  isExportingPng = false,
  isExportingPdf = false,
}: HeatmapRendererProps) {

  const [now, setNow] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateNow = () => {
      setNow(getHeatmapNow(date));
    };
    updateNow();
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, [date]);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!sectionRef.current) return;
      const sw = window.innerWidth;
      setIsMobile(sw < 640);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const layout = useMemo(
    () => computeHeatmapLayout(rows, pxPerMin, { now }),
    [rows, pxPerMin, now],
  );

  const renderHeadersContent = () => (
    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${layout.stages.length}, 1fr)` }}>
      {layout.stages.map((s, i) => (
        <div
          key={s}
          className={`flex items-center justify-center text-center text-[10px] sm:text-sm font-black uppercase tracking-tighter text-black border-r border-neutral-100 ${i === layout.stages.length - 1 ? 'border-r-0' : ''} px-1 sm:px-2`}
        >
          {s}
        </div>
      ))}
    </div>
  );

  const renderTimeRailContent = () => (
    <div className="relative w-full h-full">
      {layout.hours.map(h => (
        <React.Fragment key={`time-${h}`}>
          <div
            className="absolute right-0 h-px bg-neutral-100"
            style={{ top: (h - layout.minStart) * pxPerMin, width: TICK_W }}
          />
          <div
            className="absolute -translate-y-2.5 text-[10px] sm:text-sm font-black tabular-nums text-black"
            style={{ top: (h - layout.minStart) * pxPerMin, left: isMobile ? 4 : 8 }}
          >
            {formatHeatmapHour(h)}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const renderSetsContent = () => (
    <div className="relative w-full" style={{ height: layout.heightPx }}>
      <div className="pointer-events-none absolute inset-0">
        {layout.hours.map(h => (
          <div
            key={`hline-${h}`}
            className="absolute left-0 right-0 border-t border-dashed border-neutral-600/50"
            style={{ top: (h - layout.minStart) * pxPerMin }}
          />
        ))}
        {layout.now !== null && layout.now >= layout.minStart && layout.now <= layout.maxEnd && (
          <div 
            className="absolute left-0 right-0 z-40 flex items-center"
            style={{ top: (layout.now - layout.minStart) * pxPerMin }}
          >
            <div className="h-px w-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.4)]" />
            <div className="absolute -left-1 h-2.5 w-2.5 rounded-full border border-white bg-red-600 shadow-sm" />
          </div>
        )}
      </div>

      <div className="relative grid h-full gap-0" style={{ gridTemplateColumns: `repeat(${layout.stages.length}, minmax(0, 1fr))` }}>
        {layout.stageLayouts.map((stageLayout, idx) => {
          return (
            <div key={stageLayout.stage} className={`relative border-r border-neutral-100/30 ${idx === layout.stages.length - 1 ? 'border-r-0' : ''}`}>
              {stageLayout.placements.map((placement) => {
                const width = `calc((100% - ${(placement.columnCount - 1) * SLOT_GAP_PX}px) / ${placement.columnCount})`;
                const left  = `calc(${placement.columnIndex} * (100% - ${(placement.columnCount - 1) * SLOT_GAP_PX}px) / ${placement.columnCount} + ${placement.columnIndex * SLOT_GAP_PX}px)`;
                return (
                  <div key={`${stageLayout.stage}-${placement.row.artist}-${placement.row.start}-${placement.row.end}`} className="absolute left-1.5 right-1.5" style={{ top: placement.top }}>
                    <div className="relative" style={{ height: placement.innerHeight }}>
                      <div
                        className={`${CARD_BORDER} absolute inset-y-0 flex flex-col items-center justify-center text-center px-1 transition-all z-10 overflow-hidden shadow-sm`}
                        style={{ left, width, height: '100%', backgroundColor: placement.backgroundColor, color: placement.textColor }}
                      >
                        <div className="text-[10px] sm:text-[12px] font-black leading-[1.1] truncate w-full tracking-tighter">
                          {placement.row.artist}
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

  const mobileRailW = 56;
  const mobileStageW = 136;
  const desktopStageW = 180;
  const desktopMinWidth = Math.max(800, layout.stages.length * desktopStageW);
  const mobileMinWidth = Math.max(560, mobileRailW + layout.stages.length * mobileStageW);
  const handlePngExport = onExportPng ?? onExport;
  const isBusy = isExportingPng || isExportingPdf;
  const mobileFrameMaxHeight = 'calc(100svh - var(--tga-header-height) - var(--heatmap-page-chrome, 11.5rem))';

  return (
    <div 
      ref={sectionRef}
      aria-labelledby={`h-${groupKey}`} 
      className="w-full"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-8 sm:flex-nowrap sm:items-start sm:gap-6">
        <h1 id={`h-${groupKey}`} className="max-w-[14ch] text-[2rem] font-black leading-[0.92] tracking-tighter text-neutral-900 sm:max-w-none sm:text-5xl sm:leading-[0.9]">
          {title}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          {showExport && handlePngExport && (
            <motion.button
              className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-all hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm sm:tracking-normal"
              onClick={handlePngExport}
              whileHover={isBusy ? undefined : { y: -2, boxShadow: '0 12px 24px rgba(0,0,0,0.2)' }}
              whileTap={isBusy ? undefined : { scale: 0.98 }}
              disabled={isBusy}
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isExportingPng ? 'Exporting PNG…' : 'PNG'}
            </motion.button>
          )}
          {showExport && onExportPdf && (
            <motion.button
              className="flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-900 shadow-sm transition-all hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm sm:tracking-normal"
              onClick={onExportPdf}
              whileHover={isBusy ? undefined : { y: -2 }}
              whileTap={isBusy ? undefined : { scale: 0.98 }}
              disabled={isBusy}
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v12m0 0l4-4m-4 4l-4-4M5 19h14" />
              </svg>
              {isExportingPdf ? 'Exporting PDF…' : 'PDF'}
            </motion.button>
          )}
        </div>
      </div>

      <div ref={registerRef} className="">
        {/* Legend - Pill Style */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 px-0.5 sm:mb-8 sm:gap-2 sm:px-1">
          {(['nahh', 'ok', 'hot', 'blazing'] as const).map((lvl) => (
            <div 
              key={lvl} 
              className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-md transition-all hover:scale-105 active:scale-95 sm:px-4 sm:py-1.5 sm:text-[11px] sm:tracking-widest"
              style={{ backgroundColor: COLORS[lvl] }}
            >
              {lvl}
            </div>
          ))}
        </div>

        {/* Unified Sticky + Scalable Heatmap Container */}
        <div 
          className={`relative rounded-2xl sm:rounded-[2rem] border border-neutral-200 bg-white shadow-2xl ${isMobile ? 'overflow-auto overscroll-contain' : 'overflow-hidden'}`}
          style={{ maxHeight: isMobile ? mobileFrameMaxHeight : '92vh' }}
        >
          {isMobile ? (
            <div
              className="relative"
              style={{ minWidth: mobileMinWidth }}
            >
              <div className="sticky top-0 z-30 flex items-stretch bg-white/95 backdrop-blur-md border-b border-neutral-100 h-[52px]">
                <div
                  className="sticky left-0 z-40 bg-white border-r border-neutral-100 shrink-0"
                  style={{ width: mobileRailW }}
                />
                <div className="flex-1 min-w-0">
                  {renderHeadersContent()}
                </div>
              </div>

              <div className="relative flex items-stretch pt-2 pb-5">
                <div
                  className="sticky left-0 z-20 bg-white/95 backdrop-blur-sm border-r border-neutral-100 shrink-0"
                  style={{ width: mobileRailW, height: layout.heightPx }}
                >
                  {renderTimeRailContent()}
                </div>

                <div className="flex-1 min-w-0">
                  {renderSetsContent()}
                </div>
              </div>
            </div>
          ) : (
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={1}
              centerOnInit={false}
              disabled={true}
              doubleClick={{ disabled: true }}
              panning={{ disabled: true, velocityDisabled: true }}
              wheel={{ disabled: true }}
            >
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full"
              >
                <div
                  className="relative overflow-visible"
                  style={{
                    minWidth: desktopMinWidth,
                    height: '100%',
                  }}
                >
                  <div className="sticky top-0 z-30 flex items-stretch bg-white/95 backdrop-blur-md border-b border-neutral-100 h-[60px] rounded-t-[2rem]">
                    <div
                      className="sticky left-0 z-40 bg-white border-r border-neutral-100 shrink-0"
                      style={{ width: 80 }}
                    />
                    <div className="flex-1">
                      {renderHeadersContent()}
                    </div>
                  </div>

                  <div className="relative flex items-stretch pt-3 pb-6">
                    <div
                      className="sticky left-0 z-20 bg-white/95 backdrop-blur-sm border-r border-neutral-100 shrink-0"
                      style={{ width: 80, height: layout.heightPx }}
                    >
                      {renderTimeRailContent()}
                    </div>

                    <div className="flex-1">
                      {renderSetsContent()}
                    </div>
                  </div>
                </div>
              </TransformComponent>
            </TransformWrapper>
          )}
        </div>
      </div>
    </div>
  );
}
