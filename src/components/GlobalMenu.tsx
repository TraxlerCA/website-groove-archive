'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CloseIcon,
  HeatmapOutlineIcon,
  HomeOutlineIcon,
  ListOutlineIcon,
  MenuIcon,
  PaperPlaneOutlineIcon,
  PlayOutlineIcon,
} from '@/components/icons';
import SuggestModal from '@/components/SuggestModal';

type Item = { label: string; href: string; icon: JSX.Element };

const MENU_ITEMS: Item[] = [
  { label: 'Serve up a set', href: '/serve', icon: <PlayOutlineIcon /> },
  { label: 'The list', href: '/list', icon: <ListOutlineIcon /> },
  { label: 'Heatmaps', href: '/heatmaps', icon: <HeatmapOutlineIcon /> },
  { label: 'Suggest a set', href: '/suggest', icon: <PaperPlaneOutlineIcon /> },
  { label: 'Home', href: '/', icon: <HomeOutlineIcon /> },
];

function useIsDesktop(minWidth = 640) {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, [minWidth]);
  return isDesktop;
}

export default function GlobalMenu() {
  const [open, setOpen] = useState(false);
  const [sheetEnter, setSheetEnter] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const pathname = usePathname() || '/';
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<HTMLAnchorElement[]>([]);

  // Reset refs array on each render to current items count
  itemRefs.current = [];

  const activeIndex = useMemo(() => {
    const idx = MENU_ITEMS.findIndex((it) =>
      it.href === '/' ? pathname === '/' : pathname.startsWith(it.href)
    );
    return idx === -1 ? undefined : idx;
  }, [pathname]);

  // Close on route change
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Outside click to close (popover)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node | null;
      const container = isDesktop ? popoverRef.current : sheetRef.current;
      if (!container) return;
      if (
        t &&
        !container.contains(t) &&
        !triggerRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open, isDesktop]);

  // Esc to close, and basic focus trap handling
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        setTimeout(() => triggerRef.current?.focus(), 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // When opening, focus the first menu item
  useEffect(() => {
    if (!open) return;
    setTimeout(() => itemRefs.current[0]?.focus(), 0);
  }, [open]);

  // Mobile sheet swipe-to-dismiss
  useEffect(() => {
    if (!open || isDesktop) return;
    // trigger slide-in after mount
    const id = setTimeout(() => setSheetEnter(true), 0);
    const el = sheetRef.current;
    if (!el) return;
    let startX = 0;
    let dx = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX ?? 0;
      dx = 0;
    };
    const onMove = (e: TouchEvent) => {
      dx = (e.touches[0]?.clientX ?? 0) - startX;
    };
    const onEnd = () => {
      // swipe right to close (sheet sits on the right)
      if (dx > 50) setOpen(false);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    return () => {
      clearTimeout(id);
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      setSheetEnter(false);
    };
  }, [open, isDesktop]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const onItemKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, idx: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % itemRefs.current.length;
      itemRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + itemRefs.current.length) % itemRefs.current.length;
      itemRefs.current[prev]?.focus();
    } else if (e.key === 'Tab' && e.shiftKey && idx === 0) {
      // Shift+Tab from first item -> close button
      e.preventDefault();
      closeRef.current?.focus();
    } else if (e.key === 'Tab' && !e.shiftKey && idx === itemRefs.current.length - 1) {
      // Tab from last item -> loop to first
      e.preventDefault();
      itemRefs.current[0]?.focus();
    }
  };

  const onCloseKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab from close -> first item
      e.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (e.key === 'Tab' && e.shiftKey) {
      // Shift+Tab on close -> last item
      e.preventDefault();
      const last = itemRefs.current.length - 1;
      if (last >= 0) itemRefs.current[last]?.focus();
    }
  };

  const trackNav = (label: string, href: string) => {
    try {
      // Optional Vercel Web Analytics if present on window
      // @ts-expect-error -- optional Vercel Web Analytics global
      if (typeof window !== 'undefined' && window.va && typeof window.va.track === 'function') {
        // @ts-expect-error -- optional Vercel Web Analytics global
        window.va.track('navigation_click', { label, href });
      }
    } catch {}
  };

  const onActivate = (href: string, label: string) => {
    setOpen(false);
    if (href === '/suggest') {
      // Open suggest modal instead of navigating
      setTimeout(() => setSuggestOpen(true), 0);
      return;
    }
    trackNav(label, href);
    router.push(href);
  };

  const commonItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 hover:bg-black/5 ${
      active ? 'font-semibold border-l-2 border-black/60 pl-[10px]' : 'pl-3'
    }`;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => (open ? handleClose() : handleOpen())}
        className="h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
      >
        <MenuIcon />
      </button>

      {open && isDesktop && (
        <div
          ref={popoverRef}
          role="menu"
          aria-label="Global navigation"
          className="absolute right-0 top-full mt-2 w-64 z-50 rounded-xl border border-black/10 bg-white shadow-lg shadow-black/10 motion-reduce:transition-none transition-transform transition-opacity duration-200 ease-out"
        >
          <div className="relative p-2">
            <button
              ref={closeRef}
              type="button"
              aria-label="Close menu"
              onClick={handleClose}
              onKeyDown={onCloseKeyDown}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
            >
              <CloseIcon />
            </button>
            <nav className="flex flex-col gap-1 pt-8" aria-label="Main">
              {MENU_ITEMS.map((it, i) => {
                const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
                return (
                  <a
                    key={it.href}
                    ref={(el) => {
                      if (el) itemRefs.current[i] = el;
                    }}
                    href={it.href}
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault();
                      onActivate(it.href, it.label);
                    }}
                    onKeyDown={(e) => onItemKeyDown(e, i)}
                    className={commonItemClass(active)}
                  >
                    <span className="shrink-0 text-black/80">{it.icon}</span>
                    <span className="truncate">{it.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {open && !isDesktop && (
        <div className="fixed inset-0 z-50" aria-labelledby="mobileMenuTitle">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" 
            onClick={handleClose}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Global navigation"
            className={`absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-xl border-l border-black/10 motion-reduce:transition-none transition-transform duration-200 ease-out ${sheetEnter ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
              <div id="mobileMenuTitle" className="text-sm font-semibold">Menu</div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close menu"
                onClick={handleClose}
                onKeyDown={onCloseKeyDown}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-2" aria-label="Main">
              {MENU_ITEMS.map((it, i) => {
                const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
                return (
                  <a
                    key={it.href}
                    ref={(el) => {
                      if (el) itemRefs.current[i] = el;
                    }}
                    href={it.href}
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault();
                      onActivate(it.href, it.label);
                    }}
                    onKeyDown={(e) => onItemKeyDown(e, i)}
                    className={`min-h-11 ${commonItemClass(active)}`}
                  >
                    <span className="shrink-0 text-black/80">{it.icon}</span>
                    <span className="truncate">{it.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}
      <SuggestModal open={suggestOpen} onClose={() => setSuggestOpen(false)} restoreFocusTo={triggerRef.current} />
    </div>
  );
}
