'use client';

import { bucketFromRating } from '@/lib/heatmaps';
import theme from './HeatmapTheme.module.css';

export function formatSetTime(time: string) {
  const [hour, minute] = time.split(':');
  return `${String(Number(hour) % 24).padStart(2, '0')}:${minute}`;
}

export function HeatLevel({ rating }: { rating?: string | null }) {
  const bucket = bucketFromRating(rating);
  if (!bucket) return null;
  const count = { nahh: 1, ok: 2, hot: 3, blazing: 4 }[bucket];
  return <span data-testid="heat-level" role="img" aria-label={`Rating: ${bucket}`} className={`${theme.level} ${theme[bucket]}`}>
    {[0, 1, 2, 3].map(index => <i key={index} aria-hidden="true" data-active={index < count} />)}
  </span>;
}

export function RatingLegend() {
  return <div className={theme.legend} aria-label="Rating legend">
    {(['nahh', 'ok', 'hot', 'blazing'] as const).map(rating => <span key={rating}><HeatLevel rating={rating} />{rating === 'ok' ? 'OK' : rating[0].toUpperCase() + rating.slice(1)}</span>)}
    <span>Unrated</span>
  </div>;
}

export function DownloadHeatmapButton({ onClick, busy = false }: { onClick: () => void; busy?: boolean }) {
  return <button className={theme.download} type="button" onClick={onClick} disabled={busy} aria-label={busy ? 'Exporting heatmap as PNG' : 'Download heatmap as PNG'}>
    <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v10.5m-3.5-3.5 3.5 3.5 3.5-3.5" />
      <path d="M5.5 16v2.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V16" />
    </svg>
  </button>;
}
