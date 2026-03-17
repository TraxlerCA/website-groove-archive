'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeatmaps } from '@/hooks/useHeatmaps';
import { HeatmapTile } from '@/components/heatmaps/HeatmapTile';

export default function HeatmapsPage() {
  const csvUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('csv')
    : null;

  const { groups, loading, error } = useHeatmaps(csvUrl);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white pb-24 pt-12">
      <div className="mx-auto max-w-7xl px-6">
        <header className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black tracking-tighter text-neutral-900 sm:text-8xl"
          >
            Heatmaps.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 max-w-2xl text-xl font-medium text-neutral-500 sm:text-2xl"
          >
            A collection of visual set-times from the world&apos;s best electronic music festivals.
          </motion.p>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
            <h2 className="text-xl font-bold">Failed to load heatmaps</h2>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {groups.map((g) => (
                <motion.div key={g.key} variants={item}>
                  <HeatmapTile 
                    title={g.title} 
                    date={g.date} 
                  />
                </motion.div>
              ))}
              <motion.div variants={item}>
                <HeatmapTile 
                  title="Make your own" 
                  date="Tool"
                  isCustom
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
