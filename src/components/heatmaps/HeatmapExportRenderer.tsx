'use client';

import { forwardRef, useMemo } from 'react';
import {
  computeHeatmapLayout, EXPORT_OUTER_PADDING,
  EXPORT_STAGE_GUTTER, EXPORT_TIME_RAIL_WIDTH,
  normalizeHeatmapStart, normalizeHeatmapEnd,
} from '@/lib/heatmapLayout';
import { fitHeatmapLabel } from '@/lib/heatmapLabelFit';
import { bucketFromRating, SLOT_GAP_PX, type Row } from '@/lib/heatmaps';
import { RatingLegend, formatSetTime } from './HeatmapPrimitives';
import theme from './HeatmapTheme.module.css';
import styles from './DesktopHeatmap.module.css';

type Props = { title: string; date: string; rows: Row[]; pxPerMin: number };

export const HeatmapExportRenderer = forwardRef<HTMLDivElement, Props>(function HeatmapExportRenderer({ title, rows, pxPerMin }, ref) {
  const shortestSet = Math.min(...rows.map(row => normalizeHeatmapEnd(row) - normalizeHeatmapStart(row)));
  // Downloads have generous dimensions so names remain legible when zoomed.
  const scale = Math.max(pxPerMin, 88 / shortestSet);
  const layout = useMemo(() => computeHeatmapLayout(rows, scale), [rows, scale]);
  const widths = layout.stageLayouts.map(stage => Math.max(320, ...stage.placements.map(set => set.columnCount * 156)));
  const width = 2 + EXPORT_OUTER_PADDING * 2 + EXPORT_TIME_RAIL_WIDTH + widths.reduce((sum, value) => sum + value, 0) + layout.stages.length * EXPORT_STAGE_GUTTER;
  const columns = `${EXPORT_TIME_RAIL_WIDTH}px ${widths.map(value => `${value}px`).join(' ')}`;
  const hours = layout.hours.filter(hour => hour >= layout.minStart && hour <= layout.maxEnd);
  const ticks = [layout.minStart, ...hours.filter(hour => (hour - layout.minStart) * scale > 26 && (layout.maxEnd - hour) * scale > 26), layout.maxEnd];
  return <div ref={ref} data-testid="heatmap-export-surface" className={theme.surface} style={{ width, padding: EXPORT_OUTER_PADDING, boxSizing: 'border-box' }}>
    <h1 style={{ margin: '0 0 28px', fontSize: 40, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-.05em' }}>{title}</h1>
    <div style={{ border: '1px solid #cbd5e3', borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ display: 'grid', gridTemplateColumns: columns, columnGap: EXPORT_STAGE_GUTTER, minHeight: 64, borderBottom: '1px solid #bfcbdc' }}>
      <div className={styles.railHeading}>Time</div>
      {layout.stages.map(stage => <div key={stage} className={styles.stageHeader}>{stage}</div>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: columns, columnGap: EXPORT_STAGE_GUTTER, padding: '16px 0 24px' }}>
      <div style={{ position: 'relative', height: layout.heightPx }}>
        {ticks.map(tick => <div key={tick} style={{ position: 'absolute', top: (tick - layout.minStart) * scale, left: 8, transform: 'translateY(-50%)', font: '600 14px/1.3 ui-monospace, monospace', color: 'var(--muted)' }}>{formatSetTime(tick)}</div>)}
      </div>
      {layout.stageLayouts.map((stage, stageIndex) => <div key={stage.stage} style={{ position: 'relative', height: layout.heightPx }}>
        {hours.map(hour => <div key={hour} className={styles.hourLine} style={{ top: (hour - layout.minStart) * scale }} />)}
        {stage.placements.map((placement, index) => {
          const row = placement.row;
          const rating = bucketFromRating(row.rating) || 'unrated';
          const cardWidth = (widths[stageIndex] - (placement.columnCount - 1) * SLOT_GAP_PX) / placement.columnCount;
          const top = (normalizeHeatmapStart(row) - layout.minStart) * scale + 3;
          const height = (normalizeHeatmapEnd(row) - normalizeHeatmapStart(row)) * scale - 6;
          const labelHeight = height - 16;
          const label = fitHeatmapLabel(row.artist, {
            maxWidth: cardWidth - 24, maxHeight: labelHeight,
            baseFontSize: 24, minFontSize: 16, lineHeight: 1.15,
            maxLines: Math.max(1, Math.min(4, Math.floor(labelHeight / (16 * 1.15)))),
            fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 600,
          });
          return <div key={`${row.artist}-${row.start}-${index}`} data-testid="export-set" className={`${styles.card} ${theme.blockColour} ${theme[rating]}`} style={{ position: 'absolute', top, left: placement.columnIndex * (cardWidth + SLOT_GAP_PX), width: cardWidth, height, padding: '8px 12px' }}>
            <div className={styles.cardBody}>
              <div className={styles.artist} data-artist style={{ fontSize: label.fontSize, lineHeight: `${label.lineHeightPx}px` }}>{label.lines.map((line, lineIndex) => <div key={lineIndex}>{line}</div>)}</div>
            </div>
          </div>;
        })}
      </div>)}
    </div>
    </div>
    <footer className={styles.footer}><RatingLegend variant="blocks" /></footer>
  </div>;
});
