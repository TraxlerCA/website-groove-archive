'use client';

import { ReactNode, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from '@/components/ui';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  FloatingPortal,
} from '@floating-ui/react';

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
  const id = useId();
  const trimmed = label.trim();
  const content = (description || '').trim();

  const showTip = Boolean(content);
  const safeLabel = trimmed.toLowerCase();
  const body = children ?? <Tag>{safeLabel}</Tag>;

  const { refs, floatingStyles, context, x, y } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    strategy: 'fixed',
    transform: false,
  });

  const hover = useHover(context, { move: false, restMs: 30 });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex items-center bg-transparent p-0 text-inherit focus-visible:outline-none border-0 cursor-help"
        ref={refs.setReference}
        aria-describedby={showTip ? id : undefined}
        {...getReferenceProps()}
      >
        {body}
      </button>
      {showTip && (
        <FloatingPortal>
          <AnimatePresence>
            {open && x != null && y != null && (
              <motion.div
                key="tooltip"
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="pointer-events-none z-[100] max-w-[260px] rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-left text-xs leading-snug text-neutral-900 shadow-[0_18px_36px_rgba(15,23,42,0.16)] backdrop-blur-sm"
                role="tooltip"
                id={id}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>
        </FloatingPortal>
      )}
    </span>
  );
}
