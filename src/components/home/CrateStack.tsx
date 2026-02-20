'use client';

import { motion } from 'framer-motion';
import CrateCard from '@/components/home/CrateCard';
import type { Row } from '@/lib/types';

type CrateStackProps = {
  rows: Row[];
  activeIndex: number;
  onChangeActiveIndex: (index: number) => void;
  onPlay: (row: Row) => void;
  onOutboundClick: (href: string, row: Row) => void;
};

function wrapIndex(total: number, index: number): number {
  if (total === 0) return 0;
  return ((index % total) + total) % total;
}

export default function CrateStack({
  rows,
  activeIndex,
  onChangeActiveIndex,
  onPlay,
  onOutboundClick,
}: CrateStackProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-white/20 bg-[#060a13] p-6 text-white/75">
        No SoundCloud sets are available in this crate.
      </div>
    );
  }

  const offsets = [-1, 0, 1];

  return (
    <section className="space-y-5">
      <div className="relative mx-auto h-[560px] w-full max-w-[520px] overflow-visible">
        {offsets.map(offset => {
          const index = wrapIndex(rows.length, activeIndex + offset);
          const row = rows[index];
          const isActive = offset === 0;
          const x = offset * 34;
          const y = Math.abs(offset) * 16;
          const rotate = offset * 3.2;
          const scale = isActive ? 1 : 0.94;
          const zIndex = 5 - Math.abs(offset);
          return (
            <motion.div
              key={`${row.set}-${offset}`}
              className="absolute inset-x-0 top-0 mx-auto w-[90%] sm:w-full"
              initial={false}
              animate={{ x, y, rotate, scale, zIndex }}
              transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.85 }}
            >
              <CrateCard
                row={row}
                isActive={isActive}
                onPlay={onPlay}
                onOutboundClick={href => onOutboundClick(href, row)}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onChangeActiveIndex(wrapIndex(rows.length, activeIndex - 1))}
          className="rounded-full border border-neutral-300 bg-white/85 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/60"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onChangeActiveIndex(wrapIndex(rows.length, activeIndex + 1))}
          className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/30"
        >
          Next sleeve
        </button>
      </div>
    </section>
  );
}

