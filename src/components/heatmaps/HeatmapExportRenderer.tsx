'use client';

import { forwardRef, useMemo } from 'react';
import {
  computeHeatmapLayout, EXPORT_HEADER_HEIGHT, EXPORT_OUTER_PADDING,
  EXPORT_STAGE_GUTTER, EXPORT_STAGE_WIDTH, EXPORT_TIME_RAIL_WIDTH,
  formatHeatmapHour, getHeatmapExportSize, normalizeHeatmapStart, normalizeHeatmapEnd,
} from '@/lib/heatmapLayout';
import { fitHeatmapLabel } from '@/lib/heatmapLabelFit';
import { bucketFromRating, type Row } from '@/lib/heatmaps';
import { HeatLevel, RatingLegend, formatSetTime } from './HeatmapPrimitives';
import theme from './HeatmapTheme.module.css';
import styles from './DesktopHeatmap.module.css';

type Props = { title: string; date: string; rows: Row[]; pxPerMin: number };

export const HeatmapExportRenderer = forwardRef<HTMLDivElement, Props>(function HeatmapExportRenderer({ title, rows, pxPerMin }, ref) {
  const shortestSet = Math.min(...rows.map(row => normalizeHeatmapEnd(row) - normalizeHeatmapStart(row)));
  const scale = Math.max(pxPerMin, 30 / shortestSet);
  const layout = useMemo(() => computeHeatmapLayout(rows, scale), [rows, scale]);
  const size = getHeatmapExportSize(layout);
  const columns = `${EXPORT_TIME_RAIL_WIDTH}px repeat(${layout.stages.length}, ${EXPORT_STAGE_WIDTH}px)`;
  const hours = layout.hours.filter(hour => hour >= layout.minStart && hour <= layout.maxEnd);
  return <div ref={ref} data-testid="heatmap-export-surface" className={theme.surface} style={{ width: size.width, minHeight: size.height, padding: EXPORT_OUTER_PADDING, boxSizing: 'border-box' }}>
    <h1 style={{ margin: '0 0 24px', fontSize: 40, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-.05em' }}>{title}</h1>
    <div style={{ display: 'grid', gridTemplateColumns: columns, columnGap: EXPORT_STAGE_GUTTER, height: EXPORT_HEADER_HEIGHT, borderBottom: '1px solid #bfcbdc' }}>
      <div className={styles.railHeading}>Time</div>
      {layout.stages.map(stage => <div key={stage} className={styles.stageHeader}>{stage}</div>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: columns, columnGap: EXPORT_STAGE_GUTTER, padding: '12px 0 20px' }}>
      <div style={{ position: 'relative', height: layout.heightPx }}>
        {hours.map(hour => <div key={hour} style={{ position: 'absolute', top: (hour - layout.minStart) * scale, left: 8, transform: 'translateY(-50%)', font: '11px/1.3 ui-monospace, monospace', color: 'var(--muted)' }}>{formatHeatmapHour(hour)}</div>)}
      </div>
      {layout.stageLayouts.map(stage => <div key={stage.stage} style={{ position: 'relative', height: layout.heightPx }}>
        {hours.map(hour => <div key={hour} className={styles.hourLine} style={{ top: (hour - layout.minStart) * scale }} />)}
        {stage.placements.map((placement, index) => {
          const row = placement.row;
          const rated = Boolean(bucketFromRating(row.rating));
          const bodyWidth = Math.max(20, placement.widthPx - 20 - (rated ? 34 : 0));
                    const stackedTime = bodyWidth < 80;
                    const showTime = placement.innerHeight >= (stackedTime ? 70 : 52);
                    const labelHeight = Math.max(14, placement.innerHeight - 12 - (showTime ? (stackedTime ? 30 : 17) : 0));
          const label = fitHeatmapLabel(row.artist, {
            maxWidth: bodyWidth,
            maxHeight: labelHeight,
            baseFontSize: 16, minFontSize: 12, lineHeight: 1.15, maxLines: labelHeight >= 12 * 1.15 * 2 ? 2 : 1,
            fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 600,
          });
          return <div key={`${row.artist}-${row.start}-${index}`} data-testid="export-set" className={styles.card} style={{ position: 'absolute', top: placement.top, left: placement.leftPx, width: placement.widthPx, height: placement.innerHeight }}>
            <div className={styles.cardBody}>
              <div className={styles.artist} style={{ fontSize: label.fontSize, lineHeight: `${label.lineHeightPx}px` }}>{label.lines.map((line, lineIndex) => <div key={lineIndex}>{line}</div>)}</div>
              {showTime && <div className={`${styles.setTime} ${stackedTime ? styles.stackedTime : ''}`}>{stackedTime ? <><span>{formatSetTime(row.start)}</span><span>{formatSetTime(row.end)}</span></> : <>{formatSetTime(row.start)}—{formatSetTime(row.end)}</>}</div>}
            </div>
            <HeatLevel rating={row.rating} />
          </div>;
        })}
      </div>)}
    </div>
    <footer className={styles.footer}><RatingLegend /></footer>
  </div>;
});
