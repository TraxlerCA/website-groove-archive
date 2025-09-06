'use client';

import { useEffect, useRef } from 'react';
import type { SVGProps } from 'react';
import { usePlayer } from '@/context/PlayerProvider';

// Tiny inline icons to avoid new deps
const Play = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden {...props}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
const Pause = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden {...props}>
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);
const ExternalLink = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
    <path d="M14 3h7v7" />
    <path d="M10 14L21 3" />
    <path d="M21 14v7H3V3h7" />
  </svg>
);

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-[3px] rounded-full bg-white/15 overflow-hidden">
      <div
        className="h-full bg-white/80 transition-[width] duration-200"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function CompactPillPlayer() {
  const { current, playing, toggle, progress, setOpen, durationSec } = usePlayer();
  const onToggle = () => toggle();
  
  // Keyboard: space toggles when hovering or focusing the pill
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    };

    // Focus handling
    el.addEventListener('keydown', onKey);

    // Hover handling
    const enter = () => window.addEventListener('keydown', onKey);
    const leave = () => window.removeEventListener('keydown', onKey);
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);

    return () => {
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      window.removeEventListener('keydown', onKey);
    };
  }, [playing]);

  // Guard: render nothing if no track (hooks above remain stable)
  if (!current) return null;

  // Map current track to UI fields
  const title = current.row.set;

  // Map provider progress [0..1] -> percent for micro bar
  const pct = Math.max(0, Math.min(100, (progress ?? 0) * 100));
  // Timecode next to micro bar (elapsed / total) based on provider's durationSec
  const total = durationSec || 30*60; // fallback safety
  const elapsedSec = Math.min(total, Math.floor((progress ?? 0) * total));

  return (
    <div
      // Sticky, safe-area aware
      className={
        'pointer-events-auto fixed inset-x-0 bottom-0 z-40 ' +
        'px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]'
      }
      aria-live="polite"
    >
      <div
        ref={wrapRef}
        tabIndex={0}
        className={
          'mx-auto max-w-2xl ' +
          'rounded-full bg-neutral-900 text-white shadow-2xl ring-1 ring-black/10 ' +
          'px-4 py-2 ' +
          'outline-none focus-visible:ring-2 focus-visible:ring-white/60'
        }
      >
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={onToggle}
            className="grid place-items-center rounded-full bg-white text-neutral-900 w-8 h-8 active:scale-95 shadow ring-1 ring-black/10"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          {/* Title + micro progress */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">{title}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <div className="flex-1">
                <ProgressBar value={pct} />
              </div>
              <span className="text-[11px] text-neutral-300 tabular-nums">{fmtTime(elapsedSec)} / {fmtTime(total)}</span>
            </div>
          </div>

          {/* Open big player modal (no external popout) */}
          <button
            type="button"
            onClick={() => { if(!playing) toggle(); setOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-neutral-900 px-2.5 py-1 text-xs font-medium shadow ring-1 ring-black/10 hover:bg-neutral-50"
            aria-label="Open player"
            title="Open player"
          >
            open
            <ExternalLink className="h-4 w-4 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
}
