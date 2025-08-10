// src/app/heatmaps/page.tsx
'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTitle } from '@/components/ui';
import { HEATMAP_IMAGES } from '@/config';

export default function HeatmapsPage() {
  const [modal, setModal] = useState<string | null>(null);
  const startY = useRef<number | null>(null);

  return (
    <section className="relative z-20 min-h-screen px-6 md:px-10 pt-28 pb-14">
      <PageTitle title="heatmaps" />
      <p className="mt-3 text-sm opacity-80">
        Drop your exported images in <code className="opacity-90">/public/heatmaps</code> and register them in <code className="opacity-90">HEATMAP_IMAGES</code>.
      </p>

      {HEATMAP_IMAGES.length === 0 && <div className="mt-6 opacity-70">no heatmap images registered yet.</div>}

      <div className="mt-6 [column-width:22rem] gap-5">
        {HEATMAP_IMAGES.map(img => (
          <button key={img.src} onClick={() => setModal(img.src)} className="inline-block w-full mb-5 text-left rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 break-inside-avoid">
            <img src={img.src} alt={img.title} className="w-full object-cover" loading="lazy" />
            <div className="p-3 text-sm opacity-80">{img.title}</div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center"
            onClick={() => setModal(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onTouchStart={e => { startY.current = e.touches[0].clientY; }}
            onTouchMove={e => { const dy = e.touches[0].clientY - (startY.current || 0); if (Math.abs(dy) > 60) setModal(null); }}
          >
            <motion.img src={modal} alt="heatmap" className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl border border-white/10" initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
