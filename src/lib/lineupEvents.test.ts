import { describe, expect, it } from 'vitest';
import { isLineup } from '@/lib/heatmaps';
import { lineupRows, overbruggen } from '@/lib/lineupEvents';

describe('Overbruggen ADE timetable fixture', () => {
  it('has eleven individually rated acts across the announced stages and times', () => {
    expect(lineupRows).toHaveLength(11);
    expect(isLineup(lineupRows)).toBe(false);
    expect(new Set(lineupRows.map(row => row.artist)).size).toBe(11);
    expect(lineupRows.every(row =>
      row.festival === overbruggen.festival && row.date === '2026-10-24')).toBe(true);
    const slot = (artist: string) => {
      const row = lineupRows.find(row => row.artist === artist);
      expect(row, artist).toBeDefined();
      return [row?.stage, row?.stage_order, row?.start, row?.end];
    };
    expect(slot('Inafekt')).toEqual(['Arena', 1, '15:00', '16:30']);
    expect(slot('Sensu')).toEqual(slot('Inafekt'));
    expect(slot('NewTone')).toEqual(['Arena', 1, '16:30', '18:00']);
    expect(slot('WOLTERS')).toEqual(['Arena', 1, '18:00', '20:00']);
    expect(slot('Kyle Starkey')).toEqual(['Arena', 1, '20:00', '23:00']);
    expect(slot('CVNTS')).toEqual(['Club', 2, '15:00', '16:30']);
    expect(slot('Entasia')).toEqual(['Club', 2, '16:30', '18:30']);
    expect(slot('Ned Bennett')).toEqual(slot('Entasia'));
    expect(slot('Club Angel')).toEqual(['Club', 2, '18:30', '20:30']);
    expect(slot('Olive Anguz')).toEqual(['Club', 2, '20:30', '23:00']);
    expect(slot('STÜM')).toEqual(slot('Olive Anguz'));
  });

  it('retains the selected colour ratings', () => {
    const ratings = Object.fromEntries(lineupRows.map(({ artist, rating }) => [artist, rating]));
    expect(ratings).toMatchObject({
      'Kyle Starkey': 'blazing', 'NewTone': 'blazing', 'Olive Anguz': 'blazing',
      CVNTS: 'ok', WOLTERS: 'ok', Entasia: 'hot', 'Club Angel': 'hot',
    });
  });
});
