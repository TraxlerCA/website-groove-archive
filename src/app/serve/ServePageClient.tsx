'use client';

import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { PageTitle } from '@/components/ui';
import { YouTubeIcon, SCIcon } from '@/components/icons';
import { usePlayer } from '@/context/PlayerProvider';
import { GenreTooltip } from '@/components/GenreTooltip';
import type { Genre, Row } from '@/lib/types';

type Provider = 'youtube' | 'soundcloud';
type PickItem = { row: Row; provider: Provider };

const subhdr = 'text-[12px] font-medium tracking-wide text-neutral-600 uppercase';

const ytId = (u?: string | null) => {
  if (!u) return null;
  try {
    const url = new URL(u);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const p = url.pathname.split('/');
    const i = p.indexOf('embed');
    if (i >= 0 && p[i + 1]) return p[i + 1];
    return null;
  } catch {
    return null;
  }
};

function YTThumb({ url }: { url?: string | null }) {
  const id = ytId(url);
  const order = id
    ? [
        `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${id}/hq720.jpg`,
        `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      ]
    : [];
  const [idx, setIdx] = useState(0);
  const tried = useRef(0);
  if (!id) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={order[idx]}
      alt=""
      className="absolute inset-0 w-full h-full object-cover block"
      onError={() => {
        if (tried.current < order.length - 1) {
          tried.current++;
          setIdx(i => i + 1);
        }
      }}
    />
  );
}

function SCArtwork({ url, preserveRatio = false }: { url: string | null; preserveRatio?: boolean }) {
  const [art, setArt] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let ok = true;
    setFailed(false);
    setArt(null);
    if (!url) {
      return () => {
        ok = false;
      };
    }
    (async () => {
      try {
        const res = await fetch(`/api/soundcloud-artwork?url=${encodeURIComponent(url)}`, { cache: 'no-store' });
        const json = await res.json();
        if (ok) setArt(json?.artwork || null);
      } catch {
        if (ok) setArt(null);
      }
    })();
    return () => {
      ok = false;
    };
  }, [url]);
  if (!art || failed) {
    return <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-400" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={art}
      alt=""
      className={
        preserveRatio
          ? 'block w-full h-auto'
          : 'absolute inset-0 w-full h-full object-cover'
      }
      onError={() => setFailed(true)}
    />
  );
}

type Props = {
  rows: Row[];
  genres: Genre[];
};

export default function ServePageClient({ rows, genres }: Props) {
  const { play } = usePlayer();
  const endRef = useRef<HTMLDivElement | null>(null);
  const suggestionRef = useRef<HTMLDivElement | null>(null);

  const [genre, setGenre] = useState<'any' | string>('any');
  const [format, setFormat] = useState<'none' | Provider>('soundcloud');

  useEffect(() => {
    try {
      setGenre((localStorage.getItem('ga_genre') ?? 'any') as 'any' | string);
      const f = (localStorage.getItem('ga_format') || 'soundcloud').toLowerCase();
      setFormat(f === 'youtube' ? 'youtube' : f === 'soundcloud' ? 'soundcloud' : 'soundcloud');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('ga_genre', genre);
    } catch {}
  }, [genre]);
  useEffect(() => {
    try {
      localStorage.setItem('ga_format', format);
    } catch {}
  }, [format]);

  const genreOptions = useMemo(() => {
    const set = new Set(rows.map(r => (r.classification || '').trim()).filter(Boolean));
    return [{ label: 'Any', value: 'any' as const }, ...Array.from(set).sort().map(g => ({ label: g, value: g }))];
  }, [rows]);

  const pool = useMemo(
    () =>
      rows.filter(r => {
        if (genre !== 'any' && r.classification !== genre) return false;
        if (format === 'youtube') return !!r.youtube;
        if (format === 'soundcloud') return !!r.soundcloud;
        return !!(r.youtube || r.soundcloud);
      }),
    [rows, genre, format],
  );

  const byLabel = useMemo(() => {
    const m = new Map<string, string>();
    genres.forEach(g => {
      if (g.label) m.set(g.label.toLowerCase(), g.explanation);
    });
    return m;
  }, [genres]);

  const describeGenre = (label: string) => byLabel.get(label.toLowerCase()) || undefined;
  const labelOf = (row: Row) => (row.classification || '').trim();
  const titleOf = (row: Row) => row.set;

  const [pick, setPick] = useState<PickItem | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [hasLaunched, setHasLaunched] = useState(false);

  useEffect(() => {
    if (!pick) return;
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    if (!isMobile) return;
    const scrollEl = document.scrollingElement || document.documentElement;
    const centerOnce = () => {
      const el = suggestionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = (window.visualViewport?.height ?? window.innerHeight) || window.innerHeight;
      const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const targetTop = rect.top + currentY - Math.max(0, (viewportH - rect.height) / 2);
      const top = Math.max(0, targetTop);
      try {
        scrollEl.scrollTo({ top, behavior: 'smooth' });
      } catch {
        (scrollEl as HTMLElement).scrollTop = top;
      }
    };

    const timeouts: number[] = [];
    [120, 360, 720, 1200].forEach(ms => {
      timeouts.push(window.setTimeout(centerOnce, ms));
    });
    return () => {
      timeouts.forEach(id => window.clearTimeout(id));
    };
  }, [pick]);

  const chooseProviderForRow = (r: Row): Provider => {
    if (format === 'youtube' && r.youtube) return 'youtube';
    if (format === 'soundcloud' && r.soundcloud) return 'soundcloud';
    if (r.youtube && r.soundcloud) return Math.random() < 0.5 ? 'youtube' : 'soundcloud';
    return r.youtube ? 'youtube' : 'soundcloud';
  };

  const launch = () => {
    setIsLaunching(true);
    const chosenRow = [...pool].sort(() => Math.random() - 0.5)[0] || null;
    const chosen = chosenRow ? { row: chosenRow, provider: chooseProviderForRow(chosenRow) } : null;
    setTimeout(() => {
      setPick(chosen);
      setIsLaunching(false);
      setHasLaunched(true);
    }, 1000);
  };

  const Circle = ({ selected }: { selected: boolean }) => (
    <span className={`inline-block h-3 w-3 rounded-full border ${selected ? 'bg-black border-black' : 'border-neutral-400 bg-white'}`} />
  );
  const CircleOption = ({ label, value, icon }: { label: string; value: Provider; icon: ReactElement }) => (
    <motion.button
      type="button"
      aria-pressed={format === value}
      onClick={e => {
        e.stopPropagation();
        setFormat(f => (f === value ? 'none' : value));
      }}
      className={`h-10 px-3 rounded-lg border text-sm inline-flex items-center gap-2 ${
        format === value
          ? 'bg-white text-neutral-900 border-neutral-900'
          : 'bg-white border-neutral-300 hover:bg-neutral-50'
      }`}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ y: 0, scale: 0.99 }}
    >
      <Circle selected={format === value} />
      <span className="inline-flex items-center gap-2">
        <span className="text-neutral-700">{label}</span>
        {icon}
      </span>
    </motion.button>
  );

  return (
    <section className="container mx-auto max-w-5xl px-6 mt-10 space-y-10">
      <PageTitle title="SERVE UP A SET" />

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-[0_10px_30px_rgb(0_0_0_/_0.08)]">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="p-4 sm:p-6 space-y-3">
            <div className={subhdr}>Genre</div>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-neutral-300 bg-white px-4 py-3 text-left text-sm"
                value={genre}
                onChange={e => setGenre(e.target.value)}
              >
                {genreOptions.map(g => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-4 sm:pl-6">
            <div className={subhdr}>Format</div>
            <div className="mt-1.5 flex gap-2 justify-start sm:justify-end">
              <CircleOption label="SoundCloud" value="soundcloud" icon={<SCIcon />} />
              <CircleOption label="YouTube" value="youtube" icon={<YouTubeIcon />} />
            </div>
          </div>
          <div className="p-3 sm:col-span-2 grid place-items-center">
            <motion.button
              onClick={launch}
              whileHover={{ y: -1, scale: 1.01, boxShadow: '0 8px 16px rgba(0,0,0,.20)' }}
              whileTap={{ y: 0, scale: 0.99, boxShadow: '0 4px 10px rgba(0,0,0,.15)' }}
              disabled={isLaunching}
              className="mt-0 inline-flex h-11 w-72 rounded-full bg-[var(--accent)] text-white leading-none items-center justify-center select-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {hasLaunched ? 'Go again!' : 'Go'}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isLaunching && (
          <motion.div
            className="fixed inset-0 z-40 pointer-events-none grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'radial-gradient(1200px 1200px at 50% 50%, rgba(0,0,0,0.18), transparent 60%)' }}
          >
            <div className="relative h-40 w-40 sm:h-48 sm:w-48">
              <Image
                src="/icons/icon_serve.png"
                alt=""
                fill
                className="rounded-full select-none animate-[spin_1s_linear_1] drop-shadow-xl object-cover"
                draggable={false}
                priority
              />
              <span className="pointer-events-none absolute inset-0 m-auto block h-6 w-6 rounded-full bg-white/90 ring-2 ring-neutral-300" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLaunching && pick && (
        <div ref={suggestionRef} className="relative z-0 max-w-2xl mx-auto mt-4">
          <motion.article
            whileHover={{ y: -2 }}
            className={pick.provider === 'youtube' ? '' : 'overflow-visible'}
            onClick={() => play(pick.row, pick.provider)}
            role="button"
            aria-label="play suggestion"
          >
            <div
              className={
                'relative mx-auto ' +
                (pick.provider === 'youtube'
                  ? 'aspect-video w-full sm:w-4/5 md:w-3/4 rounded-2xl overflow-hidden'
                  : 'w-full sm:w-4/5 md:w-3/4')
              }
              style={pick.provider === 'soundcloud' ? { aspectRatio: 'auto' } : undefined}
            >
              {pick.provider === 'youtube' ? <YTThumb url={pick.row.youtube} /> : <SCArtwork url={pick.row.soundcloud} preserveRatio />}
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="rounded-full bg-white/90 border border-neutral-300 w-14 h-14 grid place-items-center">
                  {pick.provider === 'youtube' ? <YouTubeIcon /> : <SCIcon />}
                </div>
              </div>
            </div>
          </motion.article>

          <div className="px-1 pt-3 text-center">
            <h3 className="text-2xl font-semibold leading-tight break-words">{titleOf(pick.row)}</h3>
            {(() => {
              const label = labelOf(pick.row);
              if (!label) return null;
              return (
                <div className="mt-1">
                  <GenreTooltip label={label} description={describeGenre(label)}>
                    <span className="text-2xl font-semibold leading-tight">{label}</span>
                  </GenreTooltip>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      <div ref={endRef} className="h-[40px] sm:h-4" />
    </section>
  );
}
