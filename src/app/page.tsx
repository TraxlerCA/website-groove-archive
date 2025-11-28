// src/app/page.tsx
'use client';

import React from 'react';
import { GenreTooltip } from '@/components/GenreTooltip';
import { Tag } from '@/components/ui';
import { usePlayerActions } from '@/context/PlayerProvider';
import type { Genre, Row } from '@/lib/types';
// ytId helper removed (unused)

// ytThumbs helper removed (unused)

// loader for the hero highlight (no preload on first paint)
async function fetchHomeData(): Promise<{ rows: Row[]; genres: Genre[] }> {
  const res = await fetch('/api/sheets?tabs=list,genres', { cache: 'no-store' });
  const json = await res.json();
  const rows = (json?.data?.list || []) as Row[];
  const genres = (json?.data?.genres || []) as Genre[];
  const pool = rows.filter(r => Boolean(r.soundcloud));
  return { rows: pool, genres };
}

const normalize = (s: string) => s.trim().toLowerCase();

const pickRandomRow = (rows: Row[]): Row | null => {
  if (!rows.length) return null;
  const idx = Math.floor(Math.random() * rows.length);
  return rows[idx];
};

export default function Home() {
  const { play } = usePlayerActions();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [genres, setGenres] = React.useState<string[]>([]);
  const [genreTips, setGenreTips] = React.useState<Record<string, string>>({});
  const [selectedGenre, setSelectedGenre] = React.useState<string>('');
  const [featured, setFeatured] = React.useState<Row | null>(null);
  const [loadingFeatured, setLoadingFeatured] = React.useState(true);
  const heroSectionRef = React.useRef<HTMLElement | null>(null);
  const serveButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const serveEffectRef = React.useRef<ServeLaunchHandle | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { rows: pool, genres: genreEntries } = await fetchHomeData();
        if (!mounted) return;
        setRows(pool);

        const tips: Record<string, string> = {};
        for (const entry of genreEntries) {
          const label = entry.label?.trim();
          if (!label) continue;
          const key = normalize(label);
          if (!key) continue;
          const explanation = entry.explanation?.trim();
          if (explanation) tips[key] = explanation;
        }
        setGenreTips(tips);

        const seen = new Set<string>();
        const options: string[] = [];
        for (const row of pool) {
          const raw = row.classification?.trim();
          if (!raw) continue;
          const key = normalize(raw);
          if (seen.has(key)) continue;
          seen.add(key);
          options.push(raw);
        }
        options.sort((a, b) => a.localeCompare(b));
        setGenres(options);

        setFeatured(pickRandomRow(pool));
      } finally {
        if (mounted) setLoadingFeatured(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = React.useMemo(() => {
    if (!rows.length) return [];
    if (!selectedGenre) return rows;
    const target = normalize(selectedGenre);
    return rows.filter(r => normalize(r.classification || '') === target);
  }, [rows, selectedGenre]);

  const serveDisabled = filteredRows.length === 0;

  const handleServeClick = React.useCallback(() => {
    if (!filteredRows.length) return;
    const next = pickRandomRow(filteredRows);
    if (next) setFeatured(next);
    serveEffectRef.current?.blast();
  }, [filteredRows]);

  return (
    <main className="container mx-auto max-w-5xl px-6 pt-4 sm:pt-14">
      {/* generous breathing room under the wordmark */}
      <div className="h-4 sm:h-14" />

      <section
        ref={heroSectionRef}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_#fefefe,_#f3f4f6_55%,_#eef0f4)] px-6 py-12 shadow-[0_28px_60px_rgba(15,23,42,0.12)] sm:px-10 sm:py-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_rgba(148,163,184,0.08)_55%,_rgba(30,41,59,0.06)_90%)] opacity-60"
        />
        <ServeLaunchEffect
          ref={serveEffectRef}
          containerRef={heroSectionRef}
          sourceRef={serveButtonRef}
          className="z-30"
        />
        <div className="relative z-20 grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-neutral-500/80">
              Sets collected since 2019
              <span className="h-px w-12 bg-neutral-300" />
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.01em] text-neutral-900 sm:text-5xl sm:leading-[1.1] lg:text-[3.75rem] lg:leading-[1.05]">
              Found. Saved. Shared. Played on repeat.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg sm:leading-[1.7]">
              This is where the best sets come to live. The ones you stumble upon at 3am and can&rsquo;t stop thinking about. The mixes that soundtracked your best nights and your quietest mornings.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/list"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-neutral-900/15 transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/20"
              >
                Browse the list
              </a>
            </div>
          </div>

          <aside className="relative isolate overflow-hidden rounded-3xl border border-white/40 bg-white/75 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.16)] backdrop-blur">
            <div className="flex flex-col gap-5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-[#22d3ee] via-[#38bdf8] to-[#6366f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-sm shadow-cyan-500/30">
                Now spinning
              </span>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <label htmlFor="hero-genre" className="sr-only">
                  Choose a genre
                </label>
                <select
                  id="hero-genre"
                  value={selectedGenre}
                  onChange={event => setSelectedGenre(event.target.value)}
                  className="w-full rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-neutral-900/20 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/30 sm:w-auto sm:min-w-[170px]"
                >
                  <option value="">Any genre</option>
                  {genres.map(genre => (
                    <option key={genre.toLowerCase()} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={serveDisabled}
                  onClick={handleServeClick}
                  ref={serveButtonRef}
                  className="relative z-40 inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-neutral-900/20 transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Serve a set
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (featured?.soundcloud) play(featured, 'soundcloud');
                }}
                disabled={!featured?.soundcloud}
                className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-transparent transition hover:border-neutral-900/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/25 disabled:cursor-not-allowed"
              >
                {featured?.soundcloud && !loadingFeatured ? (
                  <SCArtwork url={featured.soundcloud} preserveRatio />
                ) : (
                  <div className="h-full w-full animate-pulse rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300" />
                )}
              </button>

              <div className="space-y-2">
                {featured ? (
                  <>
                    <h2 className="text-lg font-semibold text-neutral-900">{featured.set}</h2>
                    {featured.classification ? (
                      <GenreTooltip
                        label={featured.classification}
                        description={genreTips[normalize(featured.classification)]}
                      >
                        <Tag>
                          <span className="uppercase tracking-[0.3em] text-neutral-600">
                            {featured.classification}
                          </span>
                        </Tag>
                      </GenreTooltip>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200/80" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200/60" />
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm font-semibold">
                <button
                  type="button"
                  disabled={!featured?.soundcloud}
                  onClick={() => {
                    if (featured?.soundcloud) play(featured, 'soundcloud');
                  }}
                  data-disabled={featured?.soundcloud ? undefined : 'true'}
                  className="group relative inline-flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_28px_45px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_34px_52px_rgba(14,116,144,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/45 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  aria-label={featured?.set ? `Play ${featured.set}` : 'Play highlight (loading)'}
                >
                  <span className="pointer-events-none absolute inset-0 rounded-full border border-white/30 opacity-80 group-data-[disabled=true]:opacity-30" />
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.45),rgba(56,189,248,0.32),rgba(8,47,73,0.88))] opacity-40 group-data-[disabled=true]:opacity-10" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,#22d3ee,#6366f1,#22d3ee)] opacity-80 animate-[spin_14s_linear_infinite] group-data-[disabled=true]:opacity-30"
                  />
                  <span className="pointer-events-none absolute inset-[6px] rounded-full border border-white/20 bg-gradient-to-br from-[#0f172a] via-[#040a13] to-[#010103]" />
                  <span className="pointer-events-none absolute inset-[6px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(248,250,252,0.22),transparent_68%)] opacity-65 mix-blend-screen" />
                  <span className="pointer-events-none absolute inset-[22px] rounded-full border border-white/10 bg-[#010409] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]" />
                  <span className="pointer-events-none absolute inset-[12px] rounded-full bg-[repeating-radial-gradient(circle_at_center,#0f172a_0px,#0f172a_1px,transparent_1px,transparent_3px)] opacity-45 mix-blend-overlay" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[10px] overflow-hidden rounded-full group-data-[disabled=true]:opacity-40"
                  >
                    <span className="absolute inset-0 animate-[sweep_2.8s_ease-in-out_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(226,232,240,0.7)_30deg,rgba(99,102,241,0.52)_60deg,transparent_150deg)] opacity-80" />
                  </span>
                  <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#010409] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_25px_rgba(15,23,42,0.6)] group-hover:scale-[1.04] group-active:scale-95 transition">
                    <svg aria-hidden="true" className="h-5 w-5 fill-current drop-shadow-[0_10px_18px_rgba(99,102,241,0.45)]" viewBox="0 0 24 24">
                      <path d="M9 5v14l10-7z" />
                    </svg>
                  </span>
                </button>
                {featured?.soundcloud ? (
                  <a
                    className="ml-auto text-neutral-700 underline-offset-4 transition hover:text-neutral-900 hover:underline"
                    href={featured.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open on SoundCloud
                  </a>
                ) : (
                  <span className="ml-auto text-sm text-neutral-400">
                    {loadingFeatured ? 'Fetching a highlight...' : 'No highlight available right now.'}
                  </span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="h-14" />
      <style>{`
        @keyframes sweep {
          0% {
            transform: rotate(-20deg);
            opacity: 0;
          }
          35%,
          45% {
            opacity: 0.9;
          }
          80% {
            transform: rotate(180deg);
            opacity: 0;
          }
          100% {
            transform: rotate(200deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}

type ServeLaunchHandle = {
  blast: () => void;
};

type Burst = {
  start: number;
  duration: number;
  origin: { x: number; y: number };
  rings: Ring[];
  rays: Ray[];
  sparks: Spark[];
  trails: Trail[];
  glowShift: number;
  hueBase: number;
};

type Ring = { scale: number; width: number; hue: number; wobble: number; opacity: number };
type Ray = { angle: number; length: number; width: number; hue: number; drift: number };
type Spark = { angle: number; distance: number; size: number; hue: number; wobble: number; spin: number };
type Trail = { angle: number; length: number; width: number; hue: number; sway: number; offset: number };

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -7 * t));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const wrapHue = (h: number) => ((h % 360) + 360) % 360;

const ServeLaunchEffect = React.forwardRef<
  ServeLaunchHandle,
  { containerRef: React.RefObject<HTMLElement | null>; sourceRef?: React.RefObject<HTMLElement | null>; className?: string }
>(({ containerRef, sourceRef, className }, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const burstsRef = React.useRef<Burst[]>([]);
    const lastSize = React.useRef<{ w: number; h: number }>({ w: 0, h: 0 });

    const resize = React.useCallback(() => {
      const host = containerRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas) return;
      const rect = host.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width));
      const nextH = Math.max(1, Math.floor(rect.height));
      if (nextW !== lastSize.current.w || nextH !== lastSize.current.h) {
        lastSize.current = { w: nextW, h: nextH };
        canvas.width = nextW;
        canvas.height = nextH;
      }
    }, [containerRef]);

    React.useEffect(() => {
      resize();
      const onResize = () => resize();
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
      };
    }, [resize]);

    React.useEffect(() => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      let frame = 0;

      const render = (time: number) => {
        resize();
        const { w, h } = lastSize.current;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';

        burstsRef.current = burstsRef.current.filter(burst => time - burst.start < burst.duration + 260);
        const maxSpan = Math.max(w, h) || 1;

        for (const burst of burstsRef.current) {
          const baseHue = burst.hueBase;
          const life = Math.min((time - burst.start) / burst.duration, 1);
          const eased = easeOutCubic(life);

          const glowRadius = 46 + eased * maxSpan * 0.42;
          const g = ctx.createRadialGradient(burst.origin.x, burst.origin.y, 0, burst.origin.x, burst.origin.y, glowRadius);
          g.addColorStop(0, `rgba(255,255,255,${0.24 * (1 - life)})`);
          g.addColorStop(0.35, `hsla(${wrapHue(baseHue + burst.glowShift)}, 95%, 72%, ${0.42 * (1 - life)})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);

          for (const ring of burst.rings) {
            const ringProgress = easeOutExpo(Math.min(1, life * 1.05));
            const radius = (ring.scale + ringProgress * 0.9) * maxSpan * 0.45;
            const alpha = (1 - ringProgress) * ring.opacity * (1.15 - life * 0.15);
            if (alpha <= 0.01) continue;
            ctx.save();
            ctx.strokeStyle = `hsla(${wrapHue(baseHue + ring.hue)}, 92%, 72%, ${alpha})`;
            ctx.lineWidth = ring.width * (1 + ringProgress * 0.8);
            ctx.shadowBlur = 20;
            ctx.shadowColor = `hsla(${wrapHue(baseHue + ring.hue - 12)}, 92%, 65%, ${alpha * 0.9})`;
            ctx.beginPath();
            ctx.arc(
              burst.origin.x,
              burst.origin.y + Math.sin((life + ring.wobble) * Math.PI * 2) * 6,
              radius,
              0,
              Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
          }

          ctx.save();
          ctx.lineCap = 'round';
          for (const ray of burst.rays) {
            const rayProgress = easeOutExpo(life);
            const distance = ray.length * maxSpan * (0.28 + rayProgress);
            const fade = Math.max(0, 1.08 - life);
            if (fade < 0.02) continue;
            const x = burst.origin.x + Math.cos(ray.angle) * distance;
            const y = burst.origin.y + Math.sin(ray.angle) * distance + Math.sin(life * 6 + ray.drift) * 12;
            ctx.strokeStyle = `hsla(${wrapHue(baseHue + ray.hue)}, 92%, 68%, ${fade})`;
            ctx.lineWidth = Math.max(1, ray.width * (1 - life * 0.28));
            ctx.shadowBlur = 26;
            ctx.shadowColor = `hsla(${wrapHue(baseHue + ray.hue - 10)}, 90%, 60%, ${fade * 0.9})`;
            ctx.beginPath();
            ctx.moveTo(burst.origin.x, burst.origin.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          ctx.restore();

          // long arcs that sweep across the entire hero for a bombastic flare
          ctx.save();
          for (const trail of burst.trails) {
            const trailProgress = easeOutExpo(Math.min(1, life * 1.08));
            const fade = Math.max(0, 1 - life * 0.95);
            if (fade < 0.04) continue;
            const span = (0.55 + trail.length * 1.1) * maxSpan;
            const dirX = Math.cos(trail.angle);
            const dirY = Math.sin(trail.angle);
            const perpX = -dirY;
            const perpY = dirX;
            const sway = Math.sin(life * 6 + trail.sway) * 90;
            const startX = burst.origin.x + perpX * trail.offset * 0.35 * span;
            const startY = burst.origin.y + perpY * trail.offset * 0.35 * span;
            const endX = startX + dirX * span;
            const endY = startY + dirY * span;
            const ctrlX = startX + dirX * span * 0.52 + perpX * sway;
            const ctrlY = startY + dirY * span * 0.52 + perpY * sway;
            ctx.lineWidth = trail.width * (1 + trailProgress * 0.7);
            const grad = ctx.createLinearGradient(startX, startY, endX, endY);
            grad.addColorStop(0, `hsla(${wrapHue(baseHue + trail.hue - 18)}, 96%, 78%, ${0.14 * fade})`);
            grad.addColorStop(0.2, `hsla(${wrapHue(baseHue + trail.hue)}, 96%, 75%, ${0.5 * fade})`);
            grad.addColorStop(0.5, `hsla(${wrapHue(baseHue + trail.hue + 24)}, 92%, 74%, ${0.24 * fade})`);
            grad.addColorStop(1, 'transparent');
            ctx.strokeStyle = grad;
            ctx.shadowBlur = 32;
            ctx.shadowColor = `hsla(${wrapHue(baseHue + trail.hue)}, 92%, 70%, ${0.32 * fade})`;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
            ctx.stroke();
          }
          ctx.restore();

          for (const spark of burst.sparks) {
            const sparkProgress = easeOutExpo(life);
            const travel = spark.distance * maxSpan * (0.3 + sparkProgress * 0.9);
            const x =
              burst.origin.x +
              Math.cos(spark.angle + spark.spin * life) * travel +
              Math.sin(life * 8 + spark.wobble) * 8;
            const y =
              burst.origin.y +
              Math.sin(spark.angle + spark.spin * life) * travel +
              Math.cos(life * 10 + spark.wobble) * 6;
            const alpha = Math.max(0, 0.95 - life * 0.85);
            if (alpha < 0.04) continue;
            ctx.save();
            ctx.fillStyle = `hsla(${wrapHue(baseHue + spark.hue)}, 96%, 72%, ${alpha})`;
            ctx.shadowBlur = 18;
            ctx.shadowColor = `hsla(${wrapHue(baseHue + spark.hue)}, 96%, 68%, ${alpha})`;
            const size = spark.size * (1 - life * 0.32);
            ctx.beginPath();
            ctx.ellipse(x, y, size * 1.35, size, (life * 6 + spark.spin) % (Math.PI * 2), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        frame = requestAnimationFrame(render);
      };

      frame = requestAnimationFrame(render);
      return () => cancelAnimationFrame(frame);
    }, [resize]);

    const createBurst = React.useCallback(
      (origin: { x: number; y: number }, now: number) => {
        const hueShift = randomBetween(-22, 26);
        const hueBase = Math.random() * 360;
        return {
          start: now,
          duration: 1480 + Math.random() * 360,
          origin,
          glowShift: hueShift,
          hueBase,
          rings: Array.from({ length: 3 }, (_, idx) => ({
            scale: 0.18 + idx * 0.12 + Math.random() * 0.08,
            width: 3 + Math.random() * 3,
            hue: hueShift + idx * 6 + randomBetween(-6, 10),
            wobble: randomBetween(-0.15, 0.25),
            opacity: 0.5 + Math.random() * 0.2,
          })),
          rays: Array.from({ length: 32 }, () => ({
            angle: Math.random() * Math.PI * 2,
            length: 0.36 + Math.random() * 0.65,
            width: 1.2 + Math.random() * 3.8,
            hue: hueShift + randomBetween(-12, 18),
            drift: randomBetween(-1.1, 1.1),
          })),
          trails: Array.from({ length: 8 }, (_, idx) => ({
            angle: Math.random() * Math.PI * 2,
            length: 0.38 + Math.random() * 0.6,
            width: 3.5 + Math.random() * 4 + idx * 0.65,
            hue: hueShift + randomBetween(-18, 14),
            sway: randomBetween(-2, 2),
            offset: randomBetween(-0.32, 0.32),
          })),
          sparks: Array.from({ length: 38 }, () => ({
            angle: Math.random() * Math.PI * 2,
            distance: 0.2 + Math.random() * 0.7,
            size: 2.3 + Math.random() * 4.3,
            hue: hueShift + randomBetween(-10, 22),
            wobble: randomBetween(-1.2, 1.2),
            spin: randomBetween(-0.6, 0.9),
          })),
        };
      },
      []
    );

    React.useImperativeHandle(
      ref,
      () => ({
        blast: () => {
          const host = containerRef.current;
          const canvas = canvasRef.current;
          if (!host || !canvas) return;
          const hostRect = host.getBoundingClientRect();
          const sourceRect = sourceRef?.current?.getBoundingClientRect();
          const origin = sourceRect
            ? {
                x: sourceRect.left + sourceRect.width / 2 - hostRect.left,
                y: sourceRect.top + sourceRect.height / 2 - hostRect.top,
              }
            : { x: hostRect.width / 2, y: hostRect.height * 0.62 };
          const burst = createBurst(origin, performance.now());
          burstsRef.current.push(burst);
          if (burstsRef.current.length > 5) {
            burstsRef.current.shift();
          }
        },
      }),
      [containerRef, createBurst, sourceRef]
    );

    return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 select-none ${className || ''}`} aria-hidden="true" />;
  }
);
ServeLaunchEffect.displayName = 'ServeLaunchEffect';

function SCArtwork({url, preserveRatio=false}:{url:string; preserveRatio?:boolean}) {
  const [art,setArt]=React.useState<string|null>(null);
  const [failed,setFailed]=React.useState(false);
  React.useEffect(()=>{let ok=true;
    setFailed(false);
    setArt(null);
    if(!url){ return ()=>{ok=false;}; }
    (async()=>{
      try{
        const res=await fetch(`/api/soundcloud-artwork?url=${encodeURIComponent(url)}`,{cache:"no-store"});
        const json=await res.json();
        if(ok) setArt(json?.artwork||null);
      }catch{ if(ok) setArt(null); }
    })();
    return ()=>{ok=false;};
  },[url]);
  if(!art||failed){
    // when preserving natural ratio, we need an in-flow placeholder
    if (preserveRatio) {
      return <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-orange-200 to-orange-400" />;
    }
    // non-preserve case uses a positioned cover
    return <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-400"/>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img
    src={art}
    alt=""
    className={
      preserveRatio
        ? "block w-full h-auto"
        : "absolute inset-0 w-full h-full object-cover"
    }
    onError={()=>setFailed(true)}
  />;
}
