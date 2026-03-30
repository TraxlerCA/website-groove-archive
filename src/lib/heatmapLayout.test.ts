import { describe, expect, it } from 'vitest';
import {
  computeHeatmapLayout,
  formatHeatmapHour,
} from '@/lib/heatmapLayout';
import type { Row } from '@/lib/heatmaps';

const sampleRows: Row[] = [
  {
    festival: 'Test',
    date: '2026-03-30',
    stage: 'Arena',
    stage_order: 2,
    artist: 'Overlap A',
    start: '14:00',
    end: '15:00',
    rating: 'hot',
  },
  {
    festival: 'Test',
    date: '2026-03-30',
    stage: 'Arena',
    stage_order: 2,
    artist: 'Overlap B',
    start: '14:30',
    end: '15:30',
    rating: 'ok',
  },
  {
    festival: 'Test',
    date: '2026-03-30',
    stage: 'Main',
    stage_order: 1,
    artist: 'Overnight',
    start: '23:30',
    end: '01:00',
    rating: 'blazing',
  },
];

describe('computeHeatmapLayout', () => {
  it('orders stages by stage_order', () => {
    const layout = computeHeatmapLayout(sampleRows, 1.2);
    expect(layout.stages).toEqual(['Main', 'Arena']);
  });

  it('handles overnight sets and hour bounds', () => {
    const layout = computeHeatmapLayout(sampleRows, 1.2);
    expect(layout.minStart).toBe(840);
    expect(layout.maxEnd).toBe(1500);
    expect(layout.hours[0]).toBe(840);
    expect(layout.hours.at(-1)).toBe(1500);
  });

  it('splits overlapping sets into columns', () => {
    const layout = computeHeatmapLayout(sampleRows, 1.2);
    const arena = layout.stageLayouts.find((stage) => stage.stage === 'Arena');
    expect(arena).toBeDefined();
    expect(arena?.placements).toHaveLength(2);
    expect(arena?.placements[0].columnCount).toBe(2);
    expect(arena?.placements[1].columnCount).toBe(2);
    expect(arena?.placements[0].columnIndex).toBe(0);
    expect(arena?.placements[1].columnIndex).toBe(1);
  });
});

describe('formatHeatmapHour', () => {
  it('wraps back to 24-hour labels after midnight', () => {
    expect(formatHeatmapHour(1500)).toBe('01:00');
  });
});
