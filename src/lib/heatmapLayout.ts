import {
  bucketFromRating,
  clamp,
  COLORS,
  Row,
  SLOT_GAP_PX,
  toMin,
} from '@/lib/heatmaps';

export const HEATMAP_DAY_MINUTES = 24 * 60;
export const HEATMAP_NIGHT_CUTOFF_HOUR = 10;
export const HEATMAP_CUTOFF_MINUTES = HEATMAP_NIGHT_CUTOFF_HOUR * 60;

export const EXPORT_TIME_RAIL_WIDTH = 96;
export const EXPORT_STAGE_WIDTH = 208;
export const EXPORT_HEADER_HEIGHT = 80;
export const EXPORT_LEGEND_HEIGHT = 64;
export const EXPORT_TITLE_HEIGHT = 92;
export const EXPORT_OUTER_PADDING = 32;
export const EXPORT_STAGE_GUTTER = 12;

export type ComputedHeatmapPlacement = {
  row: Row;
  stage: string;
  top: number;
  naturalHeight: number;
  innerHeight: number;
  leftPercent: number;
  widthPercent: number;
  leftPx: number;
  widthPx: number;
  columnIndex: number;
  columnCount: number;
  backgroundColor: string;
  textColor: string;
};

export type ComputedHeatmapStage = {
  stage: string;
  placements: ComputedHeatmapPlacement[];
};

export type ComputedHeatmapLayout = {
  stages: string[];
  hours: number[];
  minStart: number;
  maxEnd: number;
  totalMin: number;
  heightPx: number;
  now: number | null;
  stageLayouts: ComputedHeatmapStage[];
};

type ComputeLayoutOptions = {
  now?: number | null;
};

export function getHeatmapNow(date: string, nowDate = new Date()) {
  const todayStr = nowDate.toISOString().split('T')[0];
  if (todayStr !== date) {
    return null;
  }

  const mins = nowDate.getHours() * 60 + nowDate.getMinutes();
  return mins < HEATMAP_CUTOFF_MINUTES ? mins + HEATMAP_DAY_MINUTES : mins;
}

export function normalizeHeatmapStart(row: Row) {
  const start = toMin(row.start);
  return start < HEATMAP_CUTOFF_MINUTES ? start + HEATMAP_DAY_MINUTES : start;
}

export function normalizeHeatmapEnd(row: Row) {
  const start = normalizeHeatmapStart(row);
  let end = toMin(row.end);
  end = end < HEATMAP_CUTOFF_MINUTES ? end + HEATMAP_DAY_MINUTES : end;
  if (end <= start) {
    end += HEATMAP_DAY_MINUTES;
  }
  return end;
}

export function formatHeatmapHour(mins: number) {
  const hour = Math.floor((((mins % HEATMAP_DAY_MINUTES) + HEATMAP_DAY_MINUTES) % HEATMAP_DAY_MINUTES) / 60);
  return `${String(hour).padStart(2, '0')}:00`;
}

export function computeHeatmapLayout(
  rows: Row[],
  pxPerMin: number,
  options: ComputeLayoutOptions = {},
): ComputedHeatmapLayout {
  const stagesMap = new Map<string, number>();
  rows.forEach((row) => {
    const order = Number(row.stage_order ?? 9999);
    stagesMap.set(row.stage, Math.min(stagesMap.get(row.stage) ?? order, order));
  });

  const stages = Array.from(stagesMap.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([stage]) => stage);

  const starts = rows.map(normalizeHeatmapStart);
  const ends = rows.map(normalizeHeatmapEnd);
  const minStart = Math.min(...starts);
  const maxEnd = Math.max(...ends);
  const totalMin = clamp(Math.max(60, maxEnd - minStart), 60, 20 * 60);
  const heightPx = Math.round(totalMin * pxPerMin);

  const startHour = Math.floor(minStart / 60);
  const endHour = Math.ceil(maxEnd / 60);
  const hours = Array.from(
    { length: Math.max(0, endHour - startHour + 1) },
    (_, index) => (startHour + index) * 60,
  );

  const stageLayouts = stages.map((stage) => {
    const sets = rows
      .filter((row) => row.stage === stage)
      .sort((a, b) => normalizeHeatmapStart(a) - normalizeHeatmapStart(b));

    const events = sets.map((row, index) => ({
      row,
      index,
      start: normalizeHeatmapStart(row),
      end: normalizeHeatmapEnd(row),
    }));

    const clusters: typeof events[] = [];
    let currentCluster: typeof events = [];
    let currentClusterEnd = -Infinity;

    for (const event of events) {
      if (!currentCluster.length || event.start < currentClusterEnd) {
        currentCluster.push(event);
        currentClusterEnd = Math.max(currentClusterEnd, event.end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [event];
        currentClusterEnd = event.end;
      }
    }

    if (currentCluster.length) {
      clusters.push(currentCluster);
    }

    const placementMap = new Map<number, { columnIndex: number; columnCount: number }>();

    for (const cluster of clusters) {
      const columnEnds: number[] = [];

      for (const event of cluster) {
        let columnIndex = columnEnds.findIndex((end) => end <= event.start);
        if (columnIndex === -1) {
          columnEnds.push(event.end);
          columnIndex = columnEnds.length - 1;
        } else {
          columnEnds[columnIndex] = event.end;
        }

        placementMap.set(event.index, {
          columnIndex,
          columnCount: 0,
        });
      }

      const columnCount = columnEnds.length;
      for (const event of cluster) {
        const existing = placementMap.get(event.index);
        if (existing) {
          existing.columnCount = columnCount;
        }
      }
    }

    const placements = sets.map((row, index) => {
      const start = normalizeHeatmapStart(row);
      const end = normalizeHeatmapEnd(row);
      const naturalTop = (start - minStart) * pxPerMin;
      const naturalHeight = Math.max(30, (end - start) * pxPerMin);
      const innerHeight = naturalHeight * 0.94;
      const top = naturalTop + (naturalHeight - innerHeight) / 2;

      const bucket = bucketFromRating(row.rating);
      const backgroundColor = bucket ? COLORS[bucket] : COLORS.unrated;
      const isDark = bucket === 'blazing' || bucket === 'hot' || bucket === 'nahh';
      const textColor = isDark ? '#FFFFFF' : '#111827';

      const placement = placementMap.get(index) ?? { columnIndex: 0, columnCount: 1 };
      const columnCount = Math.max(1, placement.columnCount);
      const columnIndex = Math.max(0, Math.min(placement.columnIndex, columnCount - 1));
      const totalGapPx = (columnCount - 1) * SLOT_GAP_PX;
      const widthPx = (EXPORT_STAGE_WIDTH - totalGapPx) / columnCount;
      const leftPx = columnIndex * (widthPx + SLOT_GAP_PX);
      const widthPercent = widthPx / EXPORT_STAGE_WIDTH * 100;
      const leftPercent = leftPx / EXPORT_STAGE_WIDTH * 100;

      return {
        row,
        stage,
        top,
        naturalHeight,
        innerHeight,
        leftPercent,
        widthPercent,
        leftPx,
        widthPx,
        columnIndex,
        columnCount,
        backgroundColor,
        textColor,
      };
    });

    return {
      stage,
      placements,
    };
  });

  return {
    stages,
    hours,
    minStart,
    maxEnd,
    totalMin,
    heightPx,
    now: options.now ?? null,
    stageLayouts,
  };
}

export function getHeatmapExportSize(layout: ComputedHeatmapLayout) {
  const chartWidth =
    EXPORT_TIME_RAIL_WIDTH +
    layout.stages.length * EXPORT_STAGE_WIDTH +
    Math.max(0, layout.stages.length - 1) * EXPORT_STAGE_GUTTER;

  return {
    width: chartWidth + EXPORT_OUTER_PADDING * 2,
    height:
      EXPORT_OUTER_PADDING * 2 +
      EXPORT_TITLE_HEIGHT +
      EXPORT_LEGEND_HEIGHT +
      EXPORT_HEADER_HEIGHT +
      layout.heightPx +
      32,
  };
}
