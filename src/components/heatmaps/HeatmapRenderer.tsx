'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
import { fitHeatmapLabel } from '@/lib/heatmapLabelFit';
import { isLineup } from '@/lib/heatmaps';
import { LineupRenderer } from './LineupRenderer';

interface HeatmapRendererProps {
  groupKey: string;
  title: string;
  date: string;
  rows: Row[];
  pxPerMin: number;
  registerRef?: (el: HTMLDivElement | null) => void;
  onExport?: () => void;
  onExportPng?: () => void;
  showExport?: boolean;
  isExportingPng?: boolean;
}

export function HeatmapRenderer(props: HeatmapRendererProps) {
  return isLineup(props.rows) ? <LineupRenderer {...props} /> : <ScheduledHeatmapRenderer {...props} />;
}

function ScheduledHeatmapRenderer({
  groupKey,
  title,
  date,
  rows,
  pxPerMin,
  registerRef,
  onExport,
  onExportPng,
  showExport = true,
  isExportingPng = false,
}: HeatmapRendererProps) {

  const [now, setNow] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  useEffect(() => {
    const updateNow = () => {
      setNow(getHeatmapNow(date));
    };
    updateNow();
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, [date]);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

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

  useEffect(() => {
    setActiveStageIndex((index) => Math.min(index, Math.max(0, layout.stages.length - 1)));
  }, [layout.stages.length]);

  const renderHeadersContent = () => (
    <div
      data-testid="heatmap-stage-grid"
      className="grid h-full"
      style={{ gridTemplateColumns: `repeat(${layout.stages.length}, minmax(0, 1fr))` }}
    >
      {layout.stages.map((s, i) => (
        <div
          key={s}
          data-testid="heatmap-stage-header"
          className={`flex items-center justify-center border-r border-neutral-100 px-2 text-center text-sm font-black uppercase tracking-[0.08em] text-black ${i === layout.stages.length - 1 ? 'border-r-0' : ''}`}
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

  const renderSetsContent = (
    stageLayouts = layout.stageLayouts,
    stageWidthPx = desktopLabelStageWidth,
  ) => (
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

      <div className="relative grid h-full gap-0" style={{ gridTemplateColumns: `repeat(${stageLayouts.length}, minmax(0, 1fr))` }}>
        {stageLayouts.map((stageLayout, idx) => {
          return (
            <div key={stageLayout.stage} className={`relative border-r border-neutral-100/30 ${idx === stageLayouts.length - 1 ? 'border-r-0' : ''}`}>
              {stageLayout.placements.map((placement) => {
                const width = `calc((100% - ${(placement.columnCount - 1) * SLOT_GAP_PX}px) / ${placement.columnCount})`;
                const left  = `calc(${placement.columnIndex} * (100% - ${(placement.columnCount - 1) * SLOT_GAP_PX}px) / ${placement.columnCount} + ${placement.columnIndex * SLOT_GAP_PX}px)`;
                const availableCardWidthPx =
                  ((stageWidthPx - 12) - (placement.columnCount - 1) * SLOT_GAP_PX) / placement.columnCount;
                const label = fitHeatmapLabel(placement.row.artist, {
                  maxWidth: Math.max(18, availableCardWidthPx - 8),
                  maxHeight: Math.max(12, placement.innerHeight - 6),
                  baseFontSize: isMobile ? 10 : 12,
                  minFontSize: isMobile ? 7 : 8,
                  lineHeight: 1.08,
                  maxLines: 2,
                });

                return (
                  <div key={`${stageLayout.stage}-${placement.row.artist}-${placement.row.start}-${placement.row.end}`} className="absolute left-1.5 right-1.5" style={{ top: placement.top }}>
                    <div className="relative" style={{ height: placement.innerHeight }}>
                      <div
                        className={`${CARD_BORDER} absolute inset-y-0 flex flex-col items-center justify-center text-center px-1 transition-all z-10 overflow-hidden shadow-sm`}
                        style={{ left, width, height: '100%', backgroundColor: placement.backgroundColor, color: placement.textColor }}
                      >
                        <div
                          className="w-full font-black tracking-tighter"
                          style={{ fontSize: label.fontSize, lineHeight: `${label.lineHeightPx}px` }}
                        >
                          {label.lines.map((line, lineIndex) => (
                            <div key={`${placement.row.artist}-${lineIndex}`} className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                              {line}
                            </div>
                          ))}
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

  const mobileRailW = 52;
  const mobileLabelStageWidth = 240;
  const desktopRailW = 72;
  const desktopIdealStageWidth = 424;
  const desktopMinimumStageWidth = 260;
  const desktopIdealWidth = desktopRailW + layout.stages.length * desktopIdealStageWidth;
  const desktopMinimumWidth = desktopRailW + layout.stages.length * desktopMinimumStageWidth;
  const desktopLabelStageWidth = desktopMinimumStageWidth;
  const activeStage = layout.stageLayouts[activeStageIndex] ?? layout.stageLayouts[0];
  const handlePngExport = onExportPng ?? onExport;
  const isBusy = isExportingPng;

  const moveStage = (direction: -1 | 1) => {
    setActiveStageIndex((index) => Math.max(0, Math.min(layout.stages.length - 1, index + direction)));
  };

  const handleStagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleStagePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    moveStage(deltaX < 0 ? 1 : -1);
  };

  return (
    <div 
      ref={sectionRef}
      aria-labelledby={`h-${groupKey}`} 
      className="w-full"
    >
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-8 sm:gap-6">
        <h1 id={`h-${groupKey}`} className="min-w-0 flex-1 text-[2rem] font-black leading-[0.92] tracking-tighter text-neutral-900 sm:flex-none sm:text-5xl sm:leading-[0.9]">
          {title}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          {showExport && handlePngExport && (
            <motion.button
              type="button"
              aria-label={isBusy ? 'Exporting heatmap as PNG' : 'Download heatmap as PNG'}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] transition-all hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60 sm:h-12 sm:w-12"
              onClick={handlePngExport}
              whileHover={isBusy ? undefined : { y: -2, boxShadow: '0 12px 24px rgba(0,0,0,0.2)' }}
              whileTap={isBusy ? undefined : { scale: 0.98 }}
              disabled={isBusy}
            >
              <svg aria-hidden="true" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>

      <div ref={registerRef}>
        <div
          className={`mb-4 flex flex-wrap items-center gap-1.5 px-0.5 sm:mb-5 sm:gap-2 sm:px-0 ${isMobile ? '' : 'mx-auto'}`}
          style={isMobile ? undefined : { maxWidth: desktopIdealWidth }}
        >
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

        {isMobile ? (
          <div
            role="region"
            aria-label={`${title} timetable`}
            className="mx-auto w-full"
          >
            <nav aria-label="Choose stage" className="mb-3 flex min-h-[62px] items-center justify-between">
              <button
                type="button"
                aria-label="Previous stage"
                disabled={activeStageIndex === 0}
                onClick={() => moveStage(-1)}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-neutral-950 text-white shadow-[0_7px_16px_rgba(0,0,0,0.18)] transition-transform active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none disabled:active:scale-100"
              >
                <svg aria-hidden="true" className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.2} d="M19 12H5m6-6-6 6 6 6" />
                </svg>
              </button>

              <div aria-live="polite" className="min-w-0 flex-1 text-center">
                <h2 className="truncate text-base font-black uppercase tracking-[0.12em] text-neutral-900">
                  {activeStage?.stage}
                </h2>
                <div className="mt-1 text-[11px] font-medium tracking-[0.12em] text-neutral-400">
                  {activeStageIndex + 1}/{layout.stages.length}
                </div>
              </div>

              <button
                type="button"
                aria-label="Next stage"
                disabled={activeStageIndex === layout.stages.length - 1}
                onClick={() => moveStage(1)}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-neutral-950 text-white shadow-[0_7px_16px_rgba(0,0,0,0.18)] transition-transform active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none disabled:active:scale-100"
              >
                <svg aria-hidden="true" className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.2} d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            </nav>

            <div
              data-testid="heatmap-stage-viewport"
              className="relative overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.12)]"
              style={{ touchAction: 'pan-y' }}
              onPointerDown={handleStagePointerDown}
              onPointerUp={handleStagePointerUp}
              onPointerCancel={() => { swipeStartRef.current = null; }}
            >
              <div className="relative flex items-stretch pb-4 pt-2">
                <div
                  data-testid="heatmap-time-rail"
                  className="z-20 shrink-0 border-r border-neutral-100 bg-white"
                  style={{ width: mobileRailW, height: layout.heightPx }}
                >
                  {renderTimeRailContent()}
                </div>

                <div className="min-w-0 flex-1">
                  {activeStage ? renderSetsContent([activeStage], mobileLabelStageWidth) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            role="region"
            aria-label={`${title} timetable`}
            className="relative mx-auto w-full overflow-x-auto overflow-y-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_20px_44px_rgba(0,0,0,0.14)]"
            style={{ maxWidth: desktopIdealWidth }}
          >
            <div
              className="relative w-full"
              style={{ minWidth: desktopMinimumWidth }}
            >
              <div className="flex h-[60px] items-stretch border-b border-neutral-200 bg-white">
                <div className="shrink-0 border-r border-neutral-100 bg-white" style={{ width: desktopRailW }} />
                <div className="min-w-0 flex-1">
                  {renderHeadersContent()}
                </div>
              </div>

              <div className="relative flex items-stretch pb-5 pt-2">
                <div
                  data-testid="heatmap-time-rail"
                  className="sticky left-0 z-20 shrink-0 border-r border-neutral-100 bg-white"
                  style={{ width: desktopRailW, height: layout.heightPx }}
                >
                  {renderTimeRailContent()}
                </div>

                <div className="min-w-0 flex-1">
                  {renderSetsContent(layout.stageLayouts, desktopLabelStageWidth)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
