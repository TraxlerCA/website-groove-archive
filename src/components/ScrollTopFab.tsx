// src/components/ScrollTopFab.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon } from '@/components/icons';

export default function ScrollTopFab() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <motion.button
      onClick={() => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })}
      className="fixed bottom-6 left-6 z-40 p-3 sm:p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      whileHover={prefersReduced ? undefined : { y: -4 }}
      whileTap={prefersReduced ? undefined : { y: 0 }}
      aria-label="scroll to top"
    >
      <ArrowUpIcon />
    </motion.button>
  );
}
