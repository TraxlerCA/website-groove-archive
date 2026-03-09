export type CountdownMode = 'days' | 'hours' | 'minutes' | 'seconds';

type CountdownValue = {
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  hours: string;
  minutes: string;
  seconds: string;
  isComplete: boolean;
};

const SECOND = 1000;
const MINUTE = 60;
const HOUR = 60;
const DAY = 24;
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

export const CABRA_TARGET_TIME_ZONE = 'Europe/Amsterdam';
export const CABRA_TARGET_TIMESTAMP = Date.UTC(2026, 4, 11, 8, 45, 0);
export const CABRA_TARGET_LABEL = '11 May 2026 / 10:45 CEST / Amsterdam';

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function getCabraCountdown(nowMs: number): CountdownValue {
  const safeNow = Number.isFinite(nowMs) ? nowMs : 0;
  const remainingSeconds = Math.max(0, Math.floor((CABRA_TARGET_TIMESTAMP - safeNow) / SECOND));
  const remainingMinutes = Math.floor(remainingSeconds / MINUTE);
  const remainingHours = Math.floor(remainingSeconds / (MINUTE * HOUR));
  const remainingDays = Math.floor(remainingSeconds / (MINUTE * HOUR * DAY));
  const residualSeconds = remainingSeconds % (MINUTE * HOUR * DAY);
  const hours = Math.floor(residualSeconds / (MINUTE * HOUR));
  const minutes = Math.floor((residualSeconds % (MINUTE * HOUR)) / MINUTE);
  const seconds = residualSeconds % MINUTE;

  return {
    totalDays: remainingDays,
    totalHours: remainingHours,
    totalMinutes: remainingMinutes,
    totalSeconds: remainingSeconds,
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    isComplete: remainingSeconds === 0,
  };
}

export function getCabraPrimaryValue(countdown: CountdownValue, mode: CountdownMode): number {
  if (mode === 'hours') return countdown.totalHours;
  if (mode === 'minutes') return countdown.totalMinutes;
  if (mode === 'seconds') return countdown.totalSeconds;
  return countdown.totalDays;
}

export function formatCabraDisplayValue(value: number) {
  return NUMBER_FORMATTER.format(value);
}
