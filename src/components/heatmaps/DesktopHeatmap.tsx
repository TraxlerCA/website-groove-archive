'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { bucketFromRating, SLOT_GAP_PX } from '@/lib/heatmaps';
import { computeHeatmapLayout, normalizeHeatmapEnd, normalizeHeatmapStart } from '@/lib/heatmapLayout';
import { fitHeatmapLabel } from '@/lib/heatmapLabelFit';
import type { HeatmapRendererProps } from './HeatmapRenderer';
import { DownloadHeatmapButton, RatingLegend, formatSetTime } from './HeatmapPrimitives';
import theme from './HeatmapTheme.module.css';
import styles from './DesktopHeatmap.module.css';

export function DesktopHeatmap({ groupKey, title, rows, pxPerMin, registerRef, onExport, onExportPng, showExport = true, isExportingPng, now }: HeatmapRendererProps & { now: number | null }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 900 });
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setViewport({ width: frame.clientWidth, height: window.innerHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const base = useMemo(() => computeHeatmapLayout(rows, 1), [rows]);
  const shortestSet = Math.min(...rows.map(row => normalizeHeatmapEnd(row) - normalizeHeatmapStart(row)));
  // Compact normal festival days, but retain enough height for short, consecutive sets.
  const scale = Math.max(Math.min(pxPerMin, Math.max(320, viewport.height - 400) / base.totalMin), 40 / shortestSet);
  const layout = useMemo(() => computeHeatmapLayout(rows, scale, { now }), [rows, scale, now]);
  const railWidth = 72;
  const idealWidth = railWidth + layout.stages.length * 424;
  const minimumWidth = railWidth + layout.stages.length * 180;
  const stageWidth = (Math.max(viewport.width, minimumWidth) - railWidth) / layout.stages.length;
  const download = onExportPng ?? onExport;
  const hours = layout.hours.filter(hour => hour >= layout.minStart && hour <= layout.maxEnd);
  const ticks = [layout.minStart, ...hours.filter(hour => (hour - layout.minStart) * scale > 22 && (layout.maxEnd - hour) * scale > 22), layout.maxEnd];

  return <section className={`${theme.surface} ${styles.sheet}`} style={{ maxWidth: idealWidth + 48 }} aria-labelledby={`h-${groupKey}`}>
    <header className={styles.header}>
      <h1 id={`h-${groupKey}`}>{title}</h1>
      {showExport && download && <DownloadHeatmapButton onClick={download} busy={isExportingPng} />}
    </header>
    <div ref={registerRef}>
      <div ref={frameRef} className={styles.frame} role="region" aria-label={`${title} timetable`}>
        <div style={{ minWidth: minimumWidth }}>
          <div className={styles.stageRow}>
            <div className={styles.railHeading} style={{ width: railWidth }}>Time</div>
            <div className={styles.stageGrid} data-testid="heatmap-stage-grid" style={{ gridTemplateColumns: `repeat(${layout.stages.length}, minmax(0, 1fr))` }}>
              {layout.stages.map(stage => <div className={styles.stageHeader} data-testid="heatmap-stage-header" key={stage}>{stage}</div>)}
            </div>
          </div>
          <div className={styles.chart}>
            <div className={styles.timeRail} data-testid="heatmap-time-rail" style={{ width: railWidth, height: layout.heightPx }}>
              {ticks.map(tick => <span key={tick} style={{ top: (tick - layout.minStart) * scale }}>{formatSetTime(tick)}</span>)}
            </div>
            <div className={styles.plot} style={{ height: layout.heightPx }}>
              {hours.map(hour => <div key={hour} className={styles.hourLine} style={{ top: (hour - layout.minStart) * scale }} />)}
              {now !== null && now >= layout.minStart && now <= layout.maxEnd && <div className={styles.nowLine} aria-label="Current time" style={{ top: (now - layout.minStart) * scale }} />}
              <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${layout.stages.length}, minmax(0, 1fr))` }}>
                {layout.stageLayouts.map(stage => <div key={stage.stage} className={styles.stageColumn}>
                  {stage.placements.map((placement, index) => {
                    const row = placement.row;
                    const rating = bucketFromRating(row.rating) || 'unrated';
                    const availableWidth = (stageWidth - 12 - (placement.columnCount - 1) * SLOT_GAP_PX) / placement.columnCount;
                    const bodyWidth = Math.max(20, availableWidth - 20);
                    const top = (normalizeHeatmapStart(row) - layout.minStart) * scale + 3;
                    const height = (normalizeHeatmapEnd(row) - normalizeHeatmapStart(row)) * scale - 6;
                    const labelHeight = Math.max(14, height - 12);
                    const label = fitHeatmapLabel(row.artist, {
                      maxWidth: bodyWidth,
                      maxHeight: labelHeight,
                      baseFontSize: 20, minFontSize: 14, lineHeight: 1.15, maxLines: Math.max(1, Math.min(3, Math.floor(labelHeight / (14 * 1.15)))),
                      fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 600,
                    });
                    const live = now !== null && now >= normalizeHeatmapStart(row) && now < normalizeHeatmapEnd(row);
                    return <div className={styles.placement} key={`${row.artist}-${row.start}-${index}`} style={{ top, height }}>
                      <div className={`${styles.card} ${styles.desktopCard} ${theme.blockColour} ${theme[rating]}`} data-testid="desktop-set" aria-current={live ? 'time' : undefined} aria-label={`${row.artist}, ${formatSetTime(row.start)} to ${formatSetTime(row.end)}, ${bucketFromRating(row.rating) || 'unrated'}`} title={`${row.artist} · ${formatSetTime(row.start)}–${formatSetTime(row.end)}`} style={{
                        left: `calc(${placement.columnIndex} * (100% - ${(placement.columnCount - 1) * SLOT_GAP_PX}px) / ${placement.columnCount} + ${placement.columnIndex * SLOT_GAP_PX}px)`,
                        width: `calc((100% - ${(placement.columnCount - 1) * SLOT_GAP_PX}px) / ${placement.columnCount})`,
                      }}>
                        <div className={styles.cardBody}>
                          <div className={styles.artist} data-artist style={{ fontSize: label.fontSize, lineHeight: `${label.lineHeightPx}px` }}>{label.lines.map((line, lineIndex) => <div key={lineIndex}>{line}</div>)}</div>
                        </div>
                      </div>
                    </div>;
                  })}
                </div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className={styles.footer}><RatingLegend variant="blocks" /></footer>
    </div>
  </section>;
}
