import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { usePlayerActions } from '@/context/PlayerProvider';
import { useSiteData } from '@/context/SiteDataContext';
import { getSoundcloudEligibleRows, normalizeLabel } from '@/components/home/homeMap.logic';
import { MAP_ZONES } from '@/components/home/mapZones';
import type { Row } from '@/lib/types';
import { stableHash, trackEvent } from '@/lib/analytics';
import { sanitizeMediaUrl } from '@/lib/sanitize';

type Ping = {
  id: string;
  row: Row;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  radius: number; // 0-100 (from center)
  angle: number; // 0-360 degrees
  color: string;
  isStarred: boolean;
};

export default function RadarHome() {
  const siteData = useSiteData();
  const { play } = usePlayerActions();
  const [activePing, setActivePing] = useState<Ping | null>(null);
  const [hoveredPing, setHoveredPing] = useState<Ping | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Real-time sweep state
  const [sweepAngle, setSweepAngle] = useState(0);
  const [lastScannedMap, setLastScannedMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  // Update sweep angle smoothly
  useAnimationFrame((time) => {
    // 8 seconds for a full rotation
    const newAngle = (time / 8000 * 360) % 360;
    setSweepAngle(newAngle);
  });

  const rows = useMemo(() => getSoundcloudEligibleRows(siteData.rows), [siteData.rows]);

  const pings = useMemo<Ping[]>(() => {
    if (rows.length === 0) return [];
    
    // Select a diverse set of 24 entries
    const selected = [...rows].sort((a, b) => {
      return (parseInt(stableHash(a.set), 16) || 0) - (parseInt(stableHash(b.set), 16) || 0);
    }).slice(0, 24);

    return selected.map((row, index) => {
      // 1. GENRE COLOR
      const genre = normalizeLabel(row.classification || '');
      const zone = MAP_ZONES.find(z => normalizeLabel(z.genreLabel) === genre);
      const color = zone?.accent || '#ADB5BD';

      // 2. RADIAL MAPPING (Energy -> Radius)
      const energy = parseInt(row.energie || '3') || 3;
      // Radius between 15% and 90% (to stay within radar)
      const seed = parseInt(stableHash(row.set).slice(0, 4), 16) / 0xffff;
      const r = 15 + ((energy - 1) / 4) * 70 + (seed * 5); 

      // 3. ANGULAR MAPPING (Recency -> Angle)
      // We'll use the hash of the set name but attempt to cluster by "era" if date found
      const yearMatch = row.set.match(/20\d{2}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : 2024;
      const baseAngle = ((year - 2020) * 60) % 360; // Cluster years
      const offset = (parseInt(stableHash(row.set).slice(0, 4), 16) % 60); 
      const angle = (baseAngle + offset) % 360;

      // Convert polar (r, theta) to Cartesian (x, y) for placement
      // Cartesian center is 50,50. Max radius is 50.
      const rad = (angle - 90) * (Math.PI / 180); // Offset by 90 to start at 12 o'clock
      const x = 50 + (r / 2) * Math.cos(rad);
      const y = 50 + (r / 2) * Math.sin(rad);

      return {
        id: stableHash(row.set),
        row,
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        radius: r,
        angle: angle,
        color,
        isStarred: row.set.includes('2026') || row.set.includes('DGTL') || index % 6 === 0,
      };
    });
  }, [rows]);

  // Handle high-intensity flash when swept
  useEffect(() => {
    if (!mounted) return;
    
    const updates: Record<string, number> = {};
    let changed = false;

    pings.forEach(ping => {
      // Check if sweep is passing over this angle
      // Sweep is 0-360. Threshold of ~5 degrees.
      const diff = Math.abs(sweepAngle - ping.angle);
      const wraparoundDiff = 360 - diff;
      
      if (diff < 3 || wraparoundDiff < 3) {
        updates[ping.id] = Date.now();
        changed = true;
      }
    });

    if (changed) {
      setTimeout(() => {
        setLastScannedMap(prev => ({ ...prev, ...updates }));
      }, 0);
    }
  }, [sweepAngle, pings, mounted]);

  const handlePlay = (row: Row) => {
    play(row, 'soundcloud');
    trackEvent('radar_play_clicked', { set_hash: stableHash(row.set) });
  };

  const activeOrHovered = hoveredPing || activePing;

  return (
    <main className="bg-dark-cinema relative flex h-[calc(100svh-var(--tga-header-height))] min-h-[40rem] w-full flex-col items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,0,0,0.2)_0%,_rgba(0,0,0,0.8)_100%)]" />

      {/* Crosshair Lock Lines */}
      <AnimatePresence>
        {activeOrHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-0"
          >
            <div 
              className="absolute left-0 right-0 h-[1px] bg-white/10 transition-all duration-300" 
              style={{ top: `${activeOrHovered.y}%` }} 
            />
            <div 
              className="absolute bottom-0 top-0 w-[1px] bg-white/10 transition-all duration-300" 
              style={{ left: `${activeOrHovered.x}%` }} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radar Container */}
      <div className="relative aspect-square w-full max-w-[800px] rounded-full border border-white/5 bg-black/10 shadow-[inner_0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-[1px]">
        
        {/* Grids */}
        <div className="absolute inset-4 rounded-full border border-white/5" />
        <div className="absolute inset-[22.5%] rounded-full border border-white/5" />
        <div className="absolute inset-[40%] rounded-full border border-white/5" />
        <div className="absolute left-1/2 top-1/2 h-full w-[1px] -translate-x-1/2 -translate-y-1/2 bg-white/5" />
        <div className="absolute left-1/2 top-1/2 h-[1px] w-full -translate-x-1/2 -translate-y-1/2 bg-white/5" />

        {/* Sweeping Scanner */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            transform: `rotate(${sweepAngle}deg)`,
            background: 'conic-gradient(from 0deg, transparent 70%, rgba(255, 255, 255, 0.01) 85%, rgba(255, 255, 255, 0.08) 100%)',
          }}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-12 left-12 flex flex-col gap-1 text-[8px] font-bold uppercase tracking-widest text-white/20">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span>Outbound: Energy 1-5</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span>Clockwise: 2020-2026</span>
          </div>
        </div>

        {/* Pings */}
        {mounted && pings.map((ping) => (
          <RadarPing
            key={ping.id}
            ping={ping}
            lastScanned={lastScannedMap[ping.id] || 0}
            activePing={activePing}
            setActivePing={setActivePing}
            setHoveredPing={setHoveredPing}
          />
        ))}
      </div>

      {/* Branding */}
      <div className="pointer-events-none absolute bottom-12 z-0 flex flex-col items-center justify-center text-center">
        <h1 className="mb-2 text-[10px] font-black uppercase tracking-[1em] text-white/30">
          Advanced Sonar
        </h1>
        <p className="max-w-md px-12 text-[11px] font-medium leading-relaxed text-neutral-500 uppercase tracking-widest">
          Spatial mapping active. Coordinates synced to energy density and timeline.
        </p>
      </div>

      {/* Active Set Card */}
      <AnimatePresence>
        {activePing && (
          <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 20 }}
            className="pointer-events-auto absolute bottom-8 z-50 w-full max-w-sm px-4 sm:bottom-auto sm:right-12 sm:top-1/2 sm:-translate-y-1/2"
          >
            <RadarSetCard
              row={activePing.row}
              color={pingColorToRgba(activePing.color, 0.2)}
              onPlay={() => handlePlay(activePing.row)}
              onClose={() => setActivePing(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function pingColorToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function RadarSetCard({ row, color, onPlay, onClose }: { row: Row; color: string; onPlay: () => void; onClose: () => void }) {
  const href = useMemo(() => sanitizeMediaUrl(row.soundcloud || ''), [row.soundcloud]);

  return (
    <article 
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950/90 p-8 text-white shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
      style={{ boxShadow: `0 0 50px ${color}` }}
    >
      {/* Decorative Scan Line Animation */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-[2px] bg-white/5 pointer-events-none"
      />

      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Classification</span>
          <span className="text-xs font-bold uppercase tracking-widest text-white/90" style={{ color: color.replace('0.2', '1') }}>
            {row.classification || 'Unknown Signal'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-white/5 p-2 text-neutral-500 transition hover:bg-white/10 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-8 flex flex-col gap-6">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl">
          <SCArtwork url={row.soundcloud || ''} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
             <h2 className="line-clamp-2 text-xl font-black leading-tight tracking-tighter text-white">
                {row.set}
              </h2>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={onPlay}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-neutral-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="relative z-10">Initialize Audio</span>
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 z-0 bg-neutral-200/50 skew-x-12"
          />
        </button>
        
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <span>Source Protocol</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
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
    return <div className="h-full w-full bg-white/5 animate-pulse" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={art} alt="" className="h-full w-full object-cover" />
  );
}

function RadarPing({ 
  ping, 
  lastScanned, 
  activePing, 
  setActivePing, 
  setHoveredPing 
}: { 
  ping: Ping; 
  lastScanned: number; 
  activePing: Ping | null; 
  setActivePing: (p: Ping | null) => void;
  setHoveredPing: (p: Ping | null) => void;
}) {
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    if (!lastScanned) return;
    const update = () => {
      const timeSince = Date.now() - lastScanned;
      const intensity = Math.max(0, 1 - (timeSince / 2000));
      setGlowIntensity(intensity);
      if (intensity > 0) requestAnimationFrame(update);
    };
    update();
  }, [lastScanned]);

  const isGlowing = glowIntensity > 0;

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
    >
      <button
        type="button"
        className="group relative flex h-10 w-10 items-center justify-center focus-visible:outline-none"
        onClick={() => setActivePing(ping === activePing ? null : ping)}
        onMouseEnter={() => setHoveredPing(ping)}
        onMouseLeave={() => setHoveredPing(null)}
      >
        {ping.isStarred && (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute h-8 w-8 rounded-full border border-dashed border-white/10"
          />
        )}
        
        <span 
          className="absolute h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-150" 
          style={{ 
            backgroundColor: ping.color,
            boxShadow: isGlowing ? `0 0 ${10 + glowIntensity * 15}px ${ping.color}` : 'none',
            opacity: isGlowing ? 0.9 : 0.4
          }}
        />
        
        {ping.isStarred && (
          <motion.span 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute h-full w-full"
          >
            <span className="absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-white opacity-40 shadow-[0_0_8px_white]" />
          </motion.span>
        )}

        <AnimatePresence>
          {isGlowing && (
            <motion.span 
              initial={{ scale: 0.5, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              className="absolute h-full w-full rounded-full"
              style={{ backgroundColor: ping.color }}
            />
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

