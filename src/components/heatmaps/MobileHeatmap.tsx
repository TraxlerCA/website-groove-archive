'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { bucketFromRating } from '@/lib/heatmaps';
import { computeHeatmapLayout, normalizeHeatmapStart, normalizeHeatmapEnd } from '@/lib/heatmapLayout';
import type { HeatmapRendererProps } from './HeatmapRenderer';
import styles from './MobileHeatmap.module.css';

const ratings = ['nahh', 'ok', 'hot', 'blazing', 'unrated'] as const;

function clock(time: string) {
  const [hour, minute] = time.split(':');
  return `${String(Number(hour) % 24).padStart(2, '0')}:${minute}`;
}

export function MobileHeatmap({ groupKey, title, rows, registerRef, onExportPng, onExport, showExport = true, isExportingPng, now }: HeatmapRendererProps & { now: number | null }) {
  const layout = useMemo(() => computeHeatmapLayout(rows, 1), [rows]);
  const [selectedStage, setSelectedStage] = useState(layout.stages[0]);
  const activeIndex = Math.max(0, layout.stages.indexOf(selectedStage));
  const stage = layout.stages[activeIndex];
  const sets = layout.stageLayouts[activeIndex]?.placements ?? [];
  const start = useRef<{ x: number; y: number } | null>(null);
  const exportPng = onExportPng ?? onExport;
  const moveStage = (direction: number) => setSelectedStage(layout.stages[Math.max(0, Math.min(layout.stages.length - 1, activeIndex + direction))]);
  const durations = sets.map(set => normalizeHeatmapEnd(set.row) - normalizeHeatmapStart(set.row));
  const scheduleStyle = {
    '--minutes': Math.max(1, layout.totalMin, ...layout.stageLayouts.map(stageLayout => stageLayout.placements.reduce((sum, set) => sum + normalizeHeatmapEnd(set.row) - normalizeHeatmapStart(set.row), 0))),
    '--gaps': `${Math.max(0, sets.length - 1) * 5}px`,
  } as CSSProperties;

  return (
    <section className={styles.sheet} aria-labelledby={`h-${groupKey}`}>
      <header className={styles.header}>
        <div>
          <h1 id={`h-${groupKey}`}>{title}</h1>
        </div>
        {showExport && exportPng && <button className={styles.export} type="button" onClick={exportPng} disabled={isExportingPng} aria-label={isExportingPng ? 'Exporting heatmap as PNG' : 'Download heatmap as PNG'}>
          <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v10.5m-3.5-3.5 3.5 3.5 3.5-3.5" /><path d="M5.5 16v2.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V16" /></svg>
        </button>}
      </header>

      <div ref={registerRef} role="region" aria-label={`${title} timetable`}>
        <nav className={styles.stageNav} aria-label="Choose stage">
          <div className={styles.stageName}>
            <div className={styles.selectWrap}>
              <h2 aria-live="polite">{stage}</h2>
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
              <select aria-label="Stage" value={stage} onChange={event => setSelectedStage(event.target.value)}>
                {layout.stages.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <span className={styles.count}>{activeIndex + 1}/{layout.stages.length}</span>
            </div>
          </div>
          <div className={styles.arrows}>
            <button type="button" aria-label="Previous stage" onClick={() => moveStage(-1)} disabled={activeIndex === 0}><Arrow back /></button>
            <button type="button" aria-label="Next stage" onClick={() => moveStage(1)} disabled={activeIndex === layout.stages.length - 1}><Arrow /></button>
          </div>
        </nav>

        <div className={styles.schedule} data-testid="heatmap-stage-viewport"
          onPointerDown={event => { start.current = { x: event.clientX, y: event.clientY }; }}
          onPointerCancel={() => { start.current = null; }}
          onPointerUp={event => {
            const origin = start.current;
            start.current = null;
            if (!origin) return;
            const dx = event.clientX - origin.x;
            if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(event.clientY - origin.y)) moveStage(dx < 0 ? 1 : -1);
          }}>
          <div className={styles.columnLabels} aria-hidden="true"><span>Time</span><span>Artist</span></div>
          <ol className={styles.sets} style={scheduleStyle}>
            {sets.map((set, index) => {
              const rating = bucketFromRating(set.row.rating) || 'unrated';
              const live = now !== null && now >= normalizeHeatmapStart(set.row) && now < normalizeHeatmapEnd(set.row);
              return <li key={`${stage}-${set.row.artist}-${set.row.start}-${index}`} data-testid="mobile-set" style={{ '--duration': durations[index] } as CSSProperties} aria-label={`${set.row.artist}, ${clock(set.row.start)} to ${clock(set.row.end)}, ${rating}`} aria-current={live ? 'time' : undefined} className={`${styles.set} ${styles[rating]}`}>
                <div className={styles.time}><span>{clock(set.row.start)}</span><span>{clock(set.row.end)}</span></div>
                <div className={styles.artist} data-artist>{set.row.artist}{live && <small className={styles.now}>Now</small>}</div>
              </li>;
            })}
          </ol>
        </div>

        <footer className={styles.footer}>
          <div className={styles.legend} aria-label="Rating legend">{ratings.map(rating => <span key={rating} className={styles[rating]}><i aria-hidden="true" />{rating}</span>)}</div>
        </footer>
      </div>
    </section>
  );
}

function Arrow({ back = false }: { back?: boolean }) {
  return <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={back ? 'm14 6.5-5.5 5.5 5.5 5.5' : 'm10 6.5 5.5 5.5-5.5 5.5'} /></svg>;
}
