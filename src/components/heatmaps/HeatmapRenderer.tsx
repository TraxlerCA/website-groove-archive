'use client';

import { useEffect, useState } from 'react';
import { isLineup, type Row } from '@/lib/heatmaps';
import { getHeatmapNow } from '@/lib/heatmapLayout';
import { LineupRenderer } from './LineupRenderer';
import { MobileHeatmap } from './MobileHeatmap';
import { DesktopHeatmap } from './DesktopHeatmap';

export interface HeatmapRendererProps {
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

function ScheduledHeatmapRenderer(props: HeatmapRendererProps) {
  const [now, setNow] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const update = () => setNow(getHeatmapNow(props.date));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [props.date]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile ? <MobileHeatmap {...props} now={now} /> : <DesktopHeatmap {...props} now={now} />;
}
