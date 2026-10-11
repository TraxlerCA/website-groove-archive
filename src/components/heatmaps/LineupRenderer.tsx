'use client';

import { useState } from 'react';
import { bucketFromRating, COLORS, Row } from '@/lib/heatmaps';
import { overbruggen } from '@/lib/lineupEvents';

type Props = {
  title: string; date: string; rows: Row[];
  registerRef?: (element: HTMLDivElement | null) => void;
  onExportPng?: () => void; isExportingPng?: boolean;
};
const priorities = ['blazing', 'hot', 'ok', 'nahh', ''];

export function LineupRenderer({ title, date, rows, registerRef, onExportPng, isExportingPng }: Props) {
  const [order, setOrder] = useState('alpha');
  const sorted = [...rows].sort((a, b) =>
    (order === 'rating' ? priorities.indexOf(bucketFromRating(a.rating)) - priorities.indexOf(bucketFromRating(b.rating)) : 0)
    || a.artist.localeCompare(b.artist));
  const event = title === overbruggen.festival && date === overbruggen.date ? overbruggen : null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
          Order
          <select aria-label="Artist order" value={order} onChange={e => setOrder(e.target.value)} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-900">
            <option value="alpha">Alphabetical</option><option value="rating">By rating</option>
          </select>
        </label>
        {onExportPng && <button type="button" onClick={onExportPng} disabled={isExportingPng} className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isExportingPng ? 'Exporting PNG…' : 'PNG'}</button>}
      </div>
      <div ref={registerRef} className="rounded-3xl border border-neutral-200 bg-white p-5 text-neutral-900 sm:p-8">
        <h1 className="break-words text-3xl font-black uppercase leading-tight tracking-tighter sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm font-medium text-neutral-500">{date}{event ? ` · ${event.venue}` : ''}</p>
        <div className="my-6 flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-neutral-200 px-3 py-2 font-bold">Lineup preview</span>
          <span className="text-neutral-500">Timetable pending · {rows.length} artists</span>
        </div>
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest">The lineup</h2>
        <div data-testid="lineup-grid" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {sorted.map((row, index) => {
            const rating = bucketFromRating(row.rating);
            return <div key={`${row.artist}-${index}`} data-lineup-act role="group" aria-label={`${row.artist}: ${rating || 'unrated'}`} className="min-h-32 min-w-0 rounded-xl p-4" style={{ backgroundColor: rating ? COLORS[rating] : COLORS.unrated, color: rating === 'blazing' ? '#ffffff' : '#171717' }}>
              <span className="break-words text-base font-black leading-snug tracking-tight">{row.artist}</span>
            </div>;
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-600">
          {(['nahh', 'ok', 'hot', 'blazing', 'unrated'] as const).map(rating => <span key={rating} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[rating] }} />{rating}</span>)}
        </div>
        <p className="mt-6 border-t border-neutral-200 pt-4 text-xs text-neutral-500">Artist order does not imply running order.</p>
      </div>
      {event && <a href={event.source} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold text-neutral-500 underline">Official event &amp; lineup</a>}
    </section>
  );
}
