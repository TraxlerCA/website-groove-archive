import { describe, expect, it } from 'vitest';
import {
  bucketFromRating,
  clamp,
  loadHtmlToImage,
  loadPapa,
  normalizeUtf8,
  norm,
  parseDate,
  slugify,
  toMin,
} from '@/lib/heatmaps';

describe('heatmaps utilities', () => {
  it('normalizes whitespace and unicode consistently', () => {
    expect(norm('  A\u00a0 \n B  ')).toBe('A B');
    expect(normalizeUtf8('Cafe\u0301')).toBe('Caf\u00e9');
  });

  it('parses times, dates, and numeric clamps safely', () => {
    expect(toMin('09:30')).toBe(570);
    expect(toMin('bad input')).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(parseDate(' 2026-03-30 ')).toBe(Date.parse('2026-03-30'));
  });

  it('maps rating aliases into buckets and falls back to empty', () => {
    expect(bucketFromRating(' nah ')).toBe('nahh');
    expect(bucketFromRating('yellow')).toBe('ok');
    expect(bucketFromRating('orange')).toBe('hot');
    expect(bucketFromRating('red')).toBe('blazing');
    expect(bucketFromRating('unknown')).toBe('');
    expect(bucketFromRating('empty')).toBe('');
  });

  it('slugifies labels for stable keys', () => {
    expect(slugify('Main Stage @ Groove Archive!')).toBe('main-stage-groove-archive');
  });
});

describe('heatmaps lazy loaders', () => {
  it('loads papaparse once and reuses the same module promise result', async () => {
    const first = await loadPapa();
    const second = await loadPapa();

    expect(first).toBe(second);
    expect(typeof first.parse).toBe('function');
  });

  it('loads html-to-image once and reuses the same module promise result', async () => {
    const first = await loadHtmlToImage();
    const second = await loadHtmlToImage();

    expect(first).toBe(second);
    expect(typeof first.toPng).toBe('function');
  });
});
