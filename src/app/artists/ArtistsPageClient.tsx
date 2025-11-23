'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import type { Artist } from '@/lib/types';

type Rating = Artist['rating'];

type ArtistsPageClientProps = {
  artistsByRating: Record<Rating, Artist[]>;
};

export default function ArtistsPageClient({ artistsByRating }: ArtistsPageClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-neutral-50 text-neutral-900 selection:bg-orange-200">
      {/* Subtle noise texture for premium feel */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div
        ref={containerRef}
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-24 text-center"
      >
        <motion.div
          className="flex flex-col items-center w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Blazing - Headliners */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 leading-tight mb-12 max-w-5xl">
            {artistsByRating.blazing.map((artist, i) => (
              <motion.span
                key={artist.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.04, ease: "easeOut" }}
                className="group relative cursor-pointer"
              >
                <span className="relative z-10 block text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-neutral-900 transition-all duration-300 group-hover:text-orange-600 group-hover:scale-105">
                  {artist.name}
                </span>

                {/* Separator */}
                <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-xl text-neutral-300 opacity-0 last:hidden">
                  /
                </span>
              </motion.span>
            ))}
          </div>

          {/* Hot - Support */}
          <div className="flex max-w-4xl flex-wrap justify-center gap-x-5 gap-y-2 mb-12">
            {artistsByRating.hot.map((artist, i) => (
              <motion.span
                key={artist.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.02 }}
                className="cursor-pointer text-lg md:text-xl font-semibold uppercase tracking-normal text-neutral-500 transition-all duration-300 hover:text-orange-600 hover:scale-105"
              >
                {artist.name}
              </motion.span>
            ))}
          </div>

          {/* OK - Undercard */}
          <div className="flex max-w-3xl flex-wrap justify-center gap-x-3 gap-y-2">
            {artistsByRating.ok.map((artist, i) => (
              <motion.span
                key={artist.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 + i * 0.01 }}
                className="cursor-pointer text-xs font-medium uppercase tracking-wider text-neutral-400 transition-all duration-300 hover:text-orange-600 hover:scale-105"
              >
                {artist.name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
