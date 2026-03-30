import { describe, expect, it } from 'vitest';
import { fitHeatmapLabel } from '@/lib/heatmapLabelFit';

describe('fitHeatmapLabel', () => {
  it('keeps short names on one line at base font size', () => {
    const result = fitHeatmapLabel('Jayda G', {
      maxWidth: 120,
      maxHeight: 32,
      baseFontSize: 12,
      minFontSize: 8,
      lineHeight: 1.1,
      maxLines: 2,
    });

    expect(result.lines).toEqual(['Jayda G']);
    expect(result.fontSize).toBe(12);
    expect(result.truncated).toBe(false);
  });

  it('wraps multi-word names before shrinking', () => {
    const result = fitHeatmapLabel('Laura Meester', {
      maxWidth: 58,
      maxHeight: 32,
      baseFontSize: 10,
      minFontSize: 7,
      lineHeight: 1.1,
      maxLines: 2,
    });

    expect(result.lines.length).toBe(2);
    expect(result.lines.join(' ')).toBe('Laura Meester');
    expect(result.fontSize).toBe(10);
    expect(result.truncated).toBe(false);
  });

  it('shrinks when wrapping alone still does not fit', () => {
    const result = fitHeatmapLabel('Interplanetary Criminal', {
      maxWidth: 74,
      maxHeight: 22,
      baseFontSize: 10,
      minFontSize: 7,
      lineHeight: 1.1,
      maxLines: 2,
    });

    expect(result.fontSize).toBeLessThan(10);
  });

  it('falls back to ellipsis when the box is extremely narrow', () => {
    const result = fitHeatmapLabel('Interplanetary Criminal', {
      maxWidth: 34,
      maxHeight: 16,
      baseFontSize: 10,
      minFontSize: 7,
      lineHeight: 1.1,
      maxLines: 2,
    });

    expect(result.truncated).toBe(true);
    expect(result.lines.some((line) => line.includes('…'))).toBe(true);
  });
});
