'use client';

import { ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from '@/components/ui';

export function GenreTooltip({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  const trimmed = label.trim();
  const content = (description || '').trim();

  const showTip = Boolean(content);
  const safeLabel = trimmed.toLowerCase();
  const body = children ?? <Tag>{safeLabel}</Tag>;

  const updatePosition = useCallback(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setCoords({
      top: rect.top + window.scrollY + rect.height / 2,
      left: rect.left + window.scrollX,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      updatePosition();
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, updatePosition]);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => { updatePosition(); setOpen(true); }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex items-center bg-transparent p-0 text-inherit focus-visible:outline-none border-0 cursor-help"
        onFocus={() => { updatePosition(); setOpen(true); }}
        onBlur={() => setOpen(false)}
        aria-describedby={showTip ? id : undefined}
      >
        {body}
      </button>
      {showTip && (
        <AnimatePresence>
          {open && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, x: 6, y: -4 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 6, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pointer-events-none fixed z-[100] max-w-xs rounded-xl border border-white/20 bg-black/80 px-4 py-3 text-left text-xs leading-snug text-white shadow-[0_18px_36px_rgba(0,0,0,0.32)] backdrop-blur-sm"
              role="tooltip"
              id={id}
              style={{
                top: coords.top,
                left: coords.left,
                transform: 'translate(calc(-100% - 12px), -50%)',
              }}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </span>
  );
}
