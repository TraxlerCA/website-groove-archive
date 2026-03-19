'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerActions } from '@/context/PlayerProvider';
import { useSiteData } from '@/context/SiteDataContext';
import { getSoundcloudEligibleRows } from '@/components/home/homeMap.logic';
import type { Row } from '@/lib/types';
import { stableHash, trackEvent } from '@/lib/analytics';
import { sanitizeMediaUrl } from '@/lib/sanitize';
import Link from 'next/link';

// Simple helper to seed randomness so positions are stable per session
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

type Ping = {
  id: string;
  row: Row;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  delay: number;
};

export default function RadarHome() {
  const siteData = useSiteData();
  const { play } = usePlayerActions();
  const [activePing, setActivePing] = useState<Ping | null>(null);

  const rows = useMemo(() => getSoundcloudEligibleRows(siteData.rows), [siteData.rows]);

  const pings = useMemo<Ping[]>(() => {
    if (rows.length === 0) return [];
    
    // Pick 15 random sets for the radar
    const shuffled = [...rows].sort((a, b) => {
      const hashA = parseInt(stableHash(a.set), 16) || 0;
      const hashB = parseInt(stableHash(b.set), 16) || 0;
      return hashA - hashB;
    }).slice(0, 15);

    return shuffled.map((row, index) => {
      // Keep pings roughly within a circular radius
      let x, y, dist;
      let attempts = 0;
      do {
        x = seededRandom(index + attempts * 10) * 80 + 10;
        y = seededRandom(index * 2 + attempts * 10) * 80 + 10;
        const dx = x - 50;
        const dy = y - 50;
        dist = Math.sqrt(dx * dx + dy * dy);
        attempts++;
      } while (dist > 45 && attempts < 10);
      
      return {
        id: stableHash(row.set),
        row,
        x,
        y,
        delay: seededRandom(index * 3) * 4,
      };
    });
  }, [rows]);

  const handlePlay = (row: Row) => {
    play(row, 'soundcloud');
    trackEvent('radar_play_clicked', { set_hash: stableHash(row.set) });
  };

  return (
    <main className="relative flex h-[calc(100svh-var(--tga-header-height))] min-h-[40rem] w-full flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,36,56,0.5)_0%,_rgba(0,0,0,1)_100%)]" />

      {/* Radar Container */}
      <div className="relative aspect-square w-full max-w-[800px] rounded-full border border-cyan-500/10 bg-neutral-950/40 shadow-[0_0_80px_rgba(6,182,212,0.05)]">
        
        {/* Radar Rings */}
        <div className="absolute inset-4 rounded-full border border-cyan-500/10" />
        <div className="absolute inset-1/4 rounded-full border border-cyan-500/10" />
        <div className="absolute inset-[37.5%] rounded-full border border-cyan-500/10" />
        <div className="absolute left-1/2 top-1/2 h-full w-[1px] -translate-x-1/2 -translate-y-1/2 bg-cyan-500/10" />
        <div className="absolute left-1/2 top-1/2 h-[1px] w-full -translate-x-1/2 -translate-y-1/2 bg-cyan-500/10" />

        {/* Sweeping Scanner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 70%, rgba(6, 182, 212, 0.1) 95%, rgba(6, 182, 212, 0.6) 100%)',
          }}
        />

        {/* Pings */}
        {pings.map((ping) => (
          <div
            key={ping.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
          >
            <button
              type="button"
              className="group relative flex h-6 w-6 items-center justify-center focus-visible:outline-none"
              onClick={() => setActivePing(ping === activePing ? null : ping)}
              onMouseEnter={() => setActivePing(ping)}
            >
              <span className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400 opacity-80 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-transform group-hover:scale-150" />
              <span 
                className="absolute h-full w-full animate-ping rounded-full bg-cyan-400 opacity-20"
                style={{ animationDelay: `${ping.delay}s`, animationDuration: '3s' }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Intro Text / Call to Action overlay */}
      <div className="pointer-events-none absolute bottom-12 left-0 right-0 z-0 flex flex-col items-center justify-center text-center">
        <h1 className="mb-2 text-sm font-semibold uppercase tracking-[0.4em] text-cyan-500/80">
          Global Sonar
        </h1>
        <p className="max-w-md text-base text-neutral-400/80 sm:text-lg">
          Scanning the archive for optimal frequencies. Select a signal to begin.
        </p>
        <div className="pointer-events-auto mt-6">
          <Link
            href="/list"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-8 py-3 text-sm font-medium uppercase tracking-widest text-cyan-300 backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:text-white"
          >
            <span className="relative z-10">Scan Full Archive</span>
            <div className="absolute inset-0 -z-10 translate-y-[100%] bg-cyan-500/20 transition-transform duration-300 group-hover:translate-y-0" />
          </Link>
        </div>
      </div>

      {/* Active Set Card (Glassmorphism) */}
      <AnimatePresence>
        {activePing && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto absolute bottom-8 z-50 w-full max-w-sm px-4 sm:bottom-auto sm:right-8 sm:top-1/2 sm:-translate-y-1/2"
          >
            <RadarSetCard
              row={activePing.row}
              onPlay={() => handlePlay(activePing.row)}
              onClose={() => setActivePing(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function RadarSetCard({ row, onPlay, onClose }: { row: Row; onPlay: () => void; onClose: () => void }) {
  const href = useMemo(() => sanitizeMediaUrl(row.soundcloud || ''), [row.soundcloud]);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-neutral-900/60 p-5 text-white shadow-[0_0_40px_rgba(6,182,212,0.1)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-cyan-500/20 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-cyan-300">
          {row.classification || 'Unknown Signal'}
        </span>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white sm:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-5 flex gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
          <SCArtwork url={row.soundcloud || ''} />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-100 sm:text-base">
            {row.set}
          </h2>

        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onPlay}
          className="flex-1 rounded-full bg-cyan-500 px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Initialize Playback
        </button>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-full border border-cyan-500/30 bg-transparent p-2 text-cyan-400 transition hover:bg-cyan-500/10"
            aria-label="Open on SoundCloud"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.75 16.14V7.86c0-.47-.38-.86-.85-.86-.47 0-.85.39-.85.86v8.28c0 .47.38.86.85.86.47 0 .85-.39.85-.86zm-2.09-.9V8.76c0-.46-.38-.84-.85-.84-.46 0-.84.38-.84.84v6.48c0 .46.38.84.84.84.47 0 .85-.38.85-.84zm-2.08-1.52v-3.44c0-.46-.38-.84-.85-.84-.46 0-.84.38-.84.84v3.44c0 .46.38.84.84.84.47 0 .85-.38.85-.84zm-2.09-.34v-2.76c0-.46-.38-.84-.84-.84-.47 0-.85.38-.85.84v2.76c0 .46.38.84.85.84.46 0 .84-.38.84-.84zM3.4 12.8v-1.61c0-.46-.38-.84-.84-.84C2.1 10.35 1.7 10.74 1.7 11.2v1.61c0 .46.39.84.86.84.46 0 .84-.38.84-.84zM22.3 11c0-1.47-1.19-2.66-2.66-2.66h-1.37c-.12-.86-.87-1.52-1.76-1.52-.77 0-1.42.48-1.67 1.15-.22-.09-.45-.15-.7-.15-1.05 0-1.92.86-1.92 1.92v6.46H22.3V11z"/>
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}

function SCArtwork({ url }: { url: string }) {
  const [art, setArt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!url) return;

    (async () => {
      try {
        const response = await fetch(`/api/soundcloud-artwork?url=${encodeURIComponent(url)}`);
        const payload = await response.json();
        if (active) setArt(payload?.artwork || null);
      } catch {
        // no-op
      }
    })();

    return () => { active = false; };
  }, [url]);

  if (!art) {
    return <div className="h-full w-full bg-cyan-900/20 animate-pulse" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={art} alt="" className="h-full w-full object-cover" />
  );
}
