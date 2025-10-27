'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

export const SUGGEST_TO = 'tga.suggestions@gmail.com';
export const SUGGEST_SUBJECT = 'Set suggestion for The Groove Archive';
export const SUGGEST_BODY = `Hi Joost,

Link to set:
Optional note:
My email (optional):

Thanks!`;

export function buildMailto(to: string, subject: string, body: string) {
  const q = new URLSearchParams({ subject, body }).toString();
  return `mailto:${to}?${q}`;
}

export function buildGmail(to: string, subject: string, body: string) {
  const params = new URLSearchParams({ to, su: subject, body });
  return `https://mail.google.com/mail/?view=cm&${params.toString()}`;
}

export function trackSuggest(event: string) {
  try { (window as unknown as { plausible?: (e: string) => void }).plausible?.(event); } catch {}
  try {
    const w = window as unknown as { va?: { track?: (name: string, props?: Record<string, unknown>) => void } };
    if (typeof window !== 'undefined' && w.va && typeof w.va.track === 'function') {
      w.va.track(event);
    }
  } catch {}
}

export default function SuggestModal({ open, onClose, restoreFocusTo }: { open: boolean; onClose: () => void; restoreFocusTo?: HTMLElement | null; }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const mailtoHref = useMemo(() => buildMailto(SUGGEST_TO, SUGGEST_SUBJECT, SUGGEST_BODY), []);
  const gmailHref = useMemo(() => buildGmail(SUGGEST_TO, SUGGEST_SUBJECT, SUGGEST_BODY), []);

  // focus trap + esc close, and restore focus to trigger
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const prev = (document.activeElement as HTMLElement | null) || restoreFocusTo || null;
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    ) || []).filter(el => !el.hasAttribute('disabled'));
    const first = () => focusables()[0];
    const last = () => focusables()[focusables().length - 1];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const f = focusables(); if (!f.length) return;
        const current = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (current === f[0] || !dialog?.contains(current)) { e.preventDefault(); last()?.focus(); }
        } else {
          if (current === f[f.length - 1] || !dialog?.contains(current)) { e.preventDefault(); first()?.focus(); }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    // initial focus
    setTimeout(() => first()?.focus(), 0);
    // analytics
    trackSuggest('suggest_open_modal');
    return () => {
      document.removeEventListener('keydown', onKey);
      // restore focus
      setTimeout(() => prev?.focus?.(), 0);
    };
  }, [open, onClose, restoreFocusTo]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog" aria-modal="true" aria-labelledby="suggest-title" aria-describedby="suggest-desc"
        className="absolute inset-x-0 top-6 mx-auto w-[min(640px,92vw)] rounded-xl border border-neutral-200 bg-white p-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3">
          <h2 id="suggest-title" className="text-lg font-semibold tracking-wide text-neutral-900">Send a suggestion</h2>
          <p id="suggest-desc" className="mt-1 text-sm text-neutral-700">
            Paste the link to the set. You can add a short note and your email if you want a reply.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <motion.a
            href={mailtoHref}
            onClick={() => { trackSuggest('suggest_click_mailto'); }}
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 w-full sm:w-auto"
            aria-label="Open your email app to send a suggestion"
            whileHover={{ y: -1, scale: 1.01 }} whileTap={{ y: 0, scale: 0.99 }}
          >
            Mail
          </motion.a>
          <motion.a
            href={gmailHref}
            target="_blank" rel="noopener noreferrer"
            onClick={() => { trackSuggest('suggest_click_gmail'); }}
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 w-full sm:w-auto"
            aria-label="Open Gmail to send a suggestion"
            whileHover={{ y: -1, scale: 1.01 }} whileTap={{ y: 0, scale: 0.99 }}
          >
            Open in Gmail
          </motion.a>
        </div>
      </div>
    </div>
  );
}
