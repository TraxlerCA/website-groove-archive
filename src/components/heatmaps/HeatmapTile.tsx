'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { slugify } from '@/lib/heatmaps';

interface HeatmapTileProps {
  title: string;
  date: string;
  isCustom?: boolean;
}

export function HeatmapTile({ title, date, isCustom = false }: HeatmapTileProps) {
  const slug = isCustom ? 'custom' : slugify(`${title}-${date}`);
  const href = `/heatmaps/${slug}`;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative h-64 w-full overflow-hidden sm:rounded-3xl rounded-none shadow-lg transition-all hover:shadow-2xl"
    >
      <Link href={href} className="flex h-full w-full flex-col">
        <div 
          className="relative flex h-3/4 items-center justify-center p-6 bg-neutral-100 border-b border-neutral-200"
        >
          {/* Subtle pattern or noise */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          
          <div className="relative z-10 flex flex-col items-center gap-2 text-center">
            {isCustom ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200">
                  <svg className="h-6 w-6 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-neutral-900">Make your own</span>
              </div>
            ) : (
              <span className="text-2xl font-black uppercase tracking-tighter leading-none text-neutral-900">
                {title.split(' - ')[0]}
              </span>
            )}
          </div>
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="flex h-1/4 items-center justify-end bg-white px-6 py-4">

          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              {isCustom ? 'Format' : 'Date'}
            </span>
            <span className="text-sm font-black text-neutral-900">
              {isCustom ? 'CSV' : date}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
