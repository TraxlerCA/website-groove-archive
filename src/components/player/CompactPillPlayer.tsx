'use client';

import { useEffect, useRef, useState } from 'react';
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

function ProgressBar({
  percent,
  total,
  onSeek,
  seekEnabled,
}: { percent: number; total: number; onSeek: (sec: number) => void; seekEnabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const pct = Math.max(0, Math.min(1, percent / 100));
  return (
    <div
      ref={ref}
      className="relative w-full h-[6px] rounded-full bg-white/10"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        if (!ref.current || !seekEnabled) return;
        const r = ref.current.getBoundingClientRect();
        setHoverPct(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
      }}
      onPointerLeave={() => setHoverPct(null)}
      onClick={(e) => {
        if (!ref.current || !seekEnabled) return;
        const r = ref.current.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        onSeek(p * total);
      }}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={pct * total}
    >
      <div className="absolute inset-y-0 left-0 rounded-full bg-white/60" style={{ width: `${pct * 100}%` }} />
      <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow" style={{ left: `${pct * 100}%` }} />
      {hoverPct !== null && (
        <div className="pointer-events-none absolute -top-6 -translate-x-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white ring-1 ring-white/10" style={{ left: `${hoverPct * 100}%` }}>
          {fmtTime((hoverPct || 0) * total)}
        </div>
      )}
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
  const { current, playing, toggle, progress, setOpen, durationSec, seekTo } = usePlayer();
  
  // Keyboard: space toggles when hovering or focusing the pill
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing = !!(target && (target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'));
      if (typing) return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        toggle();
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
  // Stable deps: only rebind on playing change; toggle is stable from context
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Guard: render nothing if no track (hooks above remain stable)
  if (!current) return null;

  // Map current track to UI fields
  const title = current.row.set;

  // Map provider progress [0..1] -> percent for micro bar
  const pct = Math.max(0, Math.min(100, (progress ?? 0) * 100));
  // Timecode next to micro bar (elapsed / total) based on provider's durationSec
  const seekEnabled = !!durationSec && durationSec > 0;
  const total = durationSec || 30 * 60; // fallback safety for display only
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
            onClick={toggle}
            className="grid place-items-center rounded-full bg-white text-neutral-900 w-8 h-8 active:scale-95 shadow ring-1 ring-black/10 hover-lift"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          {/* Title + micro progress */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">{title}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <div className="flex-1">
                <ProgressBar percent={pct} total={total} onSeek={seekTo} seekEnabled={seekEnabled} />
              </div>
              <span className="text-[11px] text-neutral-300 tabular-nums">{fmtTime(elapsedSec)} / {fmtTime(total)}</span>
            </div>
          </div>

          {/* Open big player modal (no external popout) */}
          <button
            type="button"
            onClick={() => { if(!playing) toggle(); setOpen(true); }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-neutral-900 ring-1 ring-black/10 hover:bg-white hover-lift"
            aria-label="Open player"
            title="Open player"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
