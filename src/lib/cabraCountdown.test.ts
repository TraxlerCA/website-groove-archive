import { describe, expect, it } from 'vitest';
import {
  CABRA_TARGET_LABEL,
  CABRA_TARGET_TIME_ZONE,
  CABRA_TARGET_TIMESTAMP,
  getCabraCountdown,
  getCabraPrimaryValue,
} from '@/lib/cabraCountdown';

describe('cabraCountdown', () => {
  it('locks the target to the Amsterdam release moment', () => {
    expect(CABRA_TARGET_TIME_ZONE).toBe('Europe/Amsterdam');
    expect(CABRA_TARGET_LABEL).toBe('11 May 2026 / 10:45 CEST / Amsterdam');
    expect(CABRA_TARGET_TIMESTAMP).toBe(Date.UTC(2026, 4, 11, 8, 45, 0));
  });

  it('decrements once per second', () => {
    const snapshot = getCabraCountdown(CABRA_TARGET_TIMESTAMP - 65_000);
    const nextSnapshot = getCabraCountdown(CABRA_TARGET_TIMESTAMP - 64_000);

    expect(snapshot.totalSeconds).toBe(65);
    expect(nextSnapshot.totalSeconds).toBe(64);
    expect(snapshot.seconds).toBe('05');
    expect(nextSnapshot.seconds).toBe('04');
  });

  it('returns days, hours, minutes, seconds, and a residual clock for each mode', () => {
    const snapshot = getCabraCountdown(CABRA_TARGET_TIMESTAMP - 93_784_000);

    expect(snapshot.totalDays).toBe(1);
    expect(snapshot.totalHours).toBe(26);
    expect(snapshot.totalMinutes).toBe(1563);
    expect(snapshot.totalSeconds).toBe(93784);
    expect(snapshot.hours).toBe('02');
    expect(snapshot.minutes).toBe('03');
    expect(snapshot.seconds).toBe('04');
    expect(getCabraPrimaryValue(snapshot, 'days')).toBe(1);
    expect(getCabraPrimaryValue(snapshot, 'hours')).toBe(26);
    expect(getCabraPrimaryValue(snapshot, 'minutes')).toBe(1563);
    expect(getCabraPrimaryValue(snapshot, 'seconds')).toBe(93784);
  });

  it('clamps to zero after expiry', () => {
    const snapshot = getCabraCountdown(CABRA_TARGET_TIMESTAMP + 5_000);

    expect(snapshot.totalDays).toBe(0);
    expect(snapshot.totalHours).toBe(0);
    expect(snapshot.totalMinutes).toBe(0);
    expect(snapshot.totalSeconds).toBe(0);
    expect(snapshot.hours).toBe('00');
    expect(snapshot.minutes).toBe('00');
    expect(snapshot.seconds).toBe('00');
    expect(snapshot.isComplete).toBe(true);
  });
});
