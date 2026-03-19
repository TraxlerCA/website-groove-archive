'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSiteData } from '@/context/SiteDataContext';

const MENU_ITEMS = [
  { id: 'heatmaps', label: 'HEATMAPS', href: '/heatmaps', bgImage: 'radial-gradient(ellipse at 50% 50%, rgba(220, 38, 38, 0.15), rgba(0,0,0,1))' },
  { id: 'artists', label: 'ARTISTS', href: '/artists', bgImage: 'radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.15), rgba(0,0,0,1))' },
  { id: 'list', label: 'THE ARCHIVE', href: '/list', bgImage: 'radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.15), rgba(0,0,0,1))' },
];

export default function KineticHome() {
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  return (
    <main className="relative flex h-[calc(100svh-var(--tga-header-height))] min-h-[40rem] w-full flex-col items-center justify-center overflow-hidden bg-black px-4 sm:px-8">
      
      {/* Dynamic Backgrounds based on hover state */}
      <AnimatePresence>
        {hoveredMenu && (
          <motion.div
            key={hoveredMenu}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: MENU_ITEMS.find((m) => m.id === hoveredMenu)?.bgImage,
            }}
          />
        )}
      </AnimatePresence>

      {/* Default grid background */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-50 block transition-opacity duration-700" style={{ opacity: hoveredMenu ? 0 : 0.5 }} />

      {/* Marquee Background (Abstract Kinetic Typography) */}
      <div className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-between py-12 opacity-[0.03] sm:opacity-5">
        <Marquee text="CURATED RAW UNFILTERED " direction={1} />
        <Marquee text="NIGHTLIFE CARTOGRAPHY " direction={-1} speed={1.2} />
        <Marquee text="GLOBAL SONAR HEATMAPS " direction={1} speed={0.8} />
      </div>

      {/* Main Navigation Menu */}
      <nav className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center space-y-2 sm:space-y-6">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onMouseEnter={() => setHoveredMenu(item.id)}
            onMouseLeave={() => setHoveredMenu(null)}
            className="group relative inline-block focus-visible:outline-none"
          >
            {/* The text layer */}
            <span className="relative block px-4 py-2 text-5xl font-black uppercase tracking-tighter text-neutral-600 transition-colors duration-500 group-hover:text-white sm:text-7xl md:text-8xl lg:text-9xl">
              {item.label}
              
              {/* Highlight bar that slashes across */}
              <span className="absolute bottom-[20%] left-0 h-[0.1em] w-0 bg-white transition-all duration-500 ease-out group-hover:w-full" />
            </span>
            
            {/* Subtle subtext that fades in on hover */}
            <span className="absolute -right-8 top-1/2 -translate-y-1/2 translate-x-4 text-sm font-bold tracking-widest text-cyan-400 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 hidden sm:block">
              [ENTER]
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer / Intro Text */}
      <div className="pointer-events-none absolute bottom-8 left-8 right-8 z-10 flex justify-between text-xs font-semibold uppercase tracking-widest text-neutral-500 sm:text-sm">
        <span>The Groove Archive</span>
        <span>Est. 2026 // Global</span>
      </div>
    </main>
  );
}

function Marquee({ text, direction, speed = 1 }: { text: string; direction: 1 | -1; speed?: number }) {
  return (
    <div className="flex w-full overflow-hidden whitespace-nowrap">
      <motion.div
        animate={{ x: direction === 1 ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ repeat: Infinity, ease: 'linear', duration: 30 / speed }}
        className="flex shrink-0 text-7xl font-black sm:text-9xl"
      >
        <span>{text.repeat(10)}</span>
      </motion.div>
    </div>
  );
}
