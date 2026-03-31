'use client';

import { motion, type PanInfo, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { startTransition, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { SCIcon, YouTubeIcon } from '@/components/icons';
import {
  ALL_GENRE_LABEL,
  buildGenreOptions,
  filterRecordBinDeck,
  type RecordBinDeckItem,
} from './deck';
import { useRecordBinArtwork } from './useRecordBinArtwork';

type RecordBinExperienceProps = {
  items: RecordBinDeckItem[];
  enableMediaActions?: boolean;
  minHeight?: string;
  eyebrow?: string | null;
  title?: string;
  description?: string | null;
  selectorClassName?: string;
};

type SlotSpec = {
  x: string;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  zIndex: number;
  showTitle: boolean;
  ariaHidden?: boolean;
};

type FocusReason = 'keyboard' | 'button' | 'drag' | 'pointer' | null;
type DisplayMode = 'one' | 'two' | 'three' | 'five';

const DESKTOP_VISIBLE_OFFSETS = [-2, -1, 0, 1, 2] as const;
const MOBILE_VISIBLE_OFFSETS = [-1, 0, 1] as const;
const DESKTOP_RENDER_OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const;
const MOBILE_RENDER_OFFSETS = [-2, -1, 0, 1, 2] as const;

function wrapIndex(total: number, index: number) {
  return ((index % total) + total) % total;
}

function getDisplayMode(itemCount: number, slotCount: 3 | 5): DisplayMode {
  if (itemCount <= 1) return 'one';
  if (itemCount === 2) return 'two';
  if (slotCount === 5 && itemCount >= 5) return 'five';
  return 'three';
}

function getVisibleOffsets(mode: DisplayMode) {
  if (mode === 'one') return [0] as const;
  if (mode === 'two') return [0, 1] as const;
  if (mode === 'five') return DESKTOP_VISIBLE_OFFSETS;
  return MOBILE_VISIBLE_OFFSETS;
}

function getRenderOffsets(mode: DisplayMode) {
  if (mode === 'one') return [0] as const;
  if (mode === 'two') return [0, 1] as const;
  if (mode === 'five') return DESKTOP_RENDER_OFFSETS;
  return MOBILE_RENDER_OFFSETS;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getFallbackArt(title: string) {
  const hash = hashString(title);
  const hue = hash % 360;
  const accentHue = (hue + 42) % 360;
  const tertiaryHue = (hue + 286) % 360;

  return {
    background: [
      `radial-gradient(circle at 20% 18%, hsla(${accentHue}, 90%, 76%, 0.36), transparent 30%)`,
      `radial-gradient(circle at 82% 16%, hsla(${tertiaryHue}, 78%, 70%, 0.22), transparent 30%)`,
      `linear-gradient(155deg, hsl(${hue}, 38%, 95%) 0%, hsl(${accentHue}, 45%, 88%) 52%, hsl(${tertiaryHue}, 48%, 84%) 100%)`,
    ].join(','),
  };
}

function getSlotSpec(mode: DisplayMode, offset: number): SlotSpec {
  if (mode === 'one') {
    return { x: '0%', y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 6, showTitle: true };
  }

  if (mode === 'two') {
    if (offset === 0) {
      return { x: '0%', y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 6, showTitle: true };
    }

    return {
      x: '24%',
      y: 24,
      rotate: 7,
      scale: 0.9,
      opacity: 0.76,
      zIndex: 3,
      showTitle: false,
    };
  }

  if (mode === 'five') {
    if (offset === -3) return { x: '-54%', y: 54, rotate: -16, scale: 0.72, opacity: 0, zIndex: 0, showTitle: false, ariaHidden: true };
    if (offset === -2) return { x: '-37%', y: 40, rotate: -11, scale: 0.82, opacity: 0.62, zIndex: 1, showTitle: false };
    if (offset === -1) return { x: '-20%', y: 20, rotate: -6, scale: 0.91, opacity: 0.86, zIndex: 3, showTitle: false };
    if (offset === 0) return { x: '0%', y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 6, showTitle: true };
    if (offset === 1) return { x: '20%', y: 20, rotate: 6, scale: 0.91, opacity: 0.86, zIndex: 3, showTitle: false };
    if (offset === 2) return { x: '37%', y: 40, rotate: 11, scale: 0.82, opacity: 0.62, zIndex: 1, showTitle: false };

    return { x: '54%', y: 54, rotate: 16, scale: 0.72, opacity: 0, zIndex: 0, showTitle: false, ariaHidden: true };
  }

  if (offset === -2) return { x: '-52%', y: 46, rotate: -16, scale: 0.72, opacity: 0, zIndex: 0, showTitle: false, ariaHidden: true };
  if (offset === -1) return { x: '-24%', y: 22, rotate: -8, scale: 0.9, opacity: 0.84, zIndex: 3, showTitle: false };
  if (offset === 0) return { x: '0%', y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 6, showTitle: true };
  if (offset === 1) return { x: '24%', y: 22, rotate: 8, scale: 0.9, opacity: 0.84, zIndex: 3, showTitle: false };

  return { x: '52%', y: 46, rotate: 16, scale: 0.72, opacity: 0, zIndex: 0, showTitle: false, ariaHidden: true };
}

function getTransition(reducedMotion: boolean) {
  if (reducedMotion) {
    return { duration: 0.16, ease: [0.22, 1, 0.36, 1] } as const;
  }

  return { type: 'spring', stiffness: 320, damping: 32, mass: 0.84 } as const;
}

const navButtonClass =
  'flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--brand-border)] bg-white/84 text-sm text-[color:var(--brand-text)] shadow-[0_16px_36px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:border-[color:var(--brand-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-page-bg)] disabled:cursor-not-allowed disabled:opacity-40';
const activePlatformButtonClass =
  'group/button flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--brand-text)] text-white shadow-[0_16px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_20px_34px_rgba(15,23,42,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-white/70 disabled:shadow-none';

export function RecordBinExperience({
  items,
  enableMediaActions = false,
  minHeight = 'calc(100svh - 3.5rem)',
  eyebrow = 'Record Bin',
  title = 'Flip through the archive until one feels right.',
  description = 'A tactile discovery lane built from the archive itself, restyled to sit comfortably inside the live Groove Archive brand.',
  selectorClassName = '',
}: RecordBinExperienceProps) {
  const prefersReducedMotion = useReducedMotion();
  const titleId = useId();
  const statusId = useId();
  const binRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLButtonElement | null>(null);
  const activeCardFrameRef = useRef<HTMLElement | null>(null);
  const focusReasonRef = useRef<FocusReason>(null);
  const [responsiveSlotCount, setResponsiveSlotCount] = useState<3 | 5>(5);
  const [activeGenre, setActiveGenre] = useState(ALL_GENRE_LABEL);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = binRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? container.clientWidth;
      setResponsiveSlotCount(width > 900 ? 5 : 3);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const genreOptions = useMemo(() => buildGenreOptions(items), [items]);
  const deckItems = useMemo(() => filterRecordBinDeck(items, activeGenre), [activeGenre, items]);
  const slotCount: 3 | 5 = deckItems.length < 5 ? 3 : responsiveSlotCount;
  const displayMode = useMemo(() => getDisplayMode(deckItems.length, slotCount), [deckItems.length, slotCount]);
  const visibleOffsets = useMemo(() => getVisibleOffsets(displayMode), [displayMode]);
  const renderOffsets = useMemo(() => getRenderOffsets(displayMode), [displayMode]);
  const safeActiveIndex = deckItems.length > 0 ? Math.min(activeIndex, deckItems.length - 1) : 0;

  const renderedCards = useMemo(
    () =>
      renderOffsets.map((offset) => {
        const itemIndex = wrapIndex(deckItems.length, safeActiveIndex + offset);
        const item = deckItems[itemIndex];

        return {
          item,
          itemIndex,
          offset,
          slot: getSlotSpec(displayMode, offset),
          isVisible: visibleOffsets.some((visibleOffset) => visibleOffset === offset),
          isActive: offset === 0,
        };
      }),
    [deckItems, displayMode, renderOffsets, safeActiveIndex, visibleOffsets],
  );

  const activeItem = deckItems[safeActiveIndex];
  const visibleSoundcloudUrls = useMemo(
    () =>
      renderedCards
        .filter((card) => card.isVisible)
        .map((card) => card.item.soundcloudUrl)
        .filter((url): url is string => Boolean(url)),
    [renderedCards],
  );
  const preloadSoundcloudUrls = useMemo(
    () =>
      renderedCards
        .filter((card) => !card.isVisible)
        .map((card) => card.item.soundcloudUrl)
        .filter((url): url is string => Boolean(url)),
    [renderedCards],
  );

  const { readArtwork } = useRecordBinArtwork({
    activeUrl: activeItem?.soundcloudUrl ?? null,
    visibleUrls: visibleSoundcloudUrls,
    preloadUrls: preloadSoundcloudUrls,
  });

  useEffect(() => {
    if (!deckItems.length || !activeCardRef.current) return;
    if (focusReasonRef.current === 'keyboard' || focusReasonRef.current === 'button') {
      activeCardRef.current.focus();
    }
    focusReasonRef.current = null;
  }, [deckItems.length, safeActiveIndex]);

  const moveBy = (delta: number, reason: FocusReason) => {
    if (deckItems.length <= 1) return;
    focusReasonRef.current = reason;
    setActiveIndex((current) => wrapIndex(deckItems.length, current + delta));
  };

  const moveToIndex = (nextIndex: number, reason: FocusReason) => {
    if (deckItems.length <= 1) return;
    focusReasonRef.current = reason;
    setActiveIndex(wrapIndex(deckItems.length, nextIndex));
  };

  const handleGenreChange = (event: ChangeEvent<HTMLSelectElement>) => {
    focusReasonRef.current = 'button';
    startTransition(() => {
      setActiveGenre(event.currentTarget.value);
      setActiveIndex(0);
    });
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const activeWidth = activeCardFrameRef.current?.offsetWidth ?? 0;
    const offsetThreshold = activeWidth * 0.14;
    const velocityThreshold = 450;

    if (info.offset.x <= -offsetThreshold || info.velocity.x <= -velocityThreshold) {
      moveBy(1, 'drag');
      return;
    }

    if (info.offset.x >= offsetThreshold || info.velocity.x >= velocityThreshold) {
      moveBy(-1, 'drag');
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveBy(1, 'keyboard');
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveBy(-1, 'keyboard');
    }
  };

  if (!activeItem) return null;

  const statusLabel = `Item ${safeActiveIndex + 1} of ${deckItems.length}: ${activeItem.title}`;
  const transition = getTransition(Boolean(prefersReducedMotion));
  const openExternalUrl = (url: string | null) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={statusId}
      onKeyDown={handleKeyDown}
      className="relative flex items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-10"
      style={{ minHeight }}
    >
      <div className="pointer-events-none absolute inset-0 bg-brand-hero" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgba(23,28,36,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(23,28,36,0.035)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div
        className="pointer-events-none absolute left-[-12%] top-[8%] h-52 w-52 rounded-full opacity-[0.14] blur-[90px]"
        style={{ backgroundColor: 'var(--brand-accent-cool)' }}
      />
      <div
        className="pointer-events-none absolute right-[-8%] top-[12%] h-48 w-48 rounded-full opacity-[0.14] blur-[82px]"
        style={{ backgroundColor: 'var(--brand-accent-warm)' }}
      />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col gap-8 lg:gap-10">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-text-muted)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 id={titleId} className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] text-[color:var(--brand-text)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--brand-text-muted)] sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        <p id={statusId} aria-live="polite" className="sr-only">
          {statusLabel}
        </p>

        <div ref={binRef} className="relative mx-auto h-[min(72vw,40rem)] min-h-[22rem] w-full max-w-[1120px] sm:min-h-[26rem] lg:h-[40rem]">
          <div
            className="pointer-events-none absolute inset-x-[16%] top-[4%] h-28 rounded-full opacity-[0.12] blur-[86px]"
            style={{ backgroundColor: 'var(--brand-accent-cool)' }}
          />
          <div className="pointer-events-none absolute inset-x-[24%] bottom-[9%] h-16 rounded-full bg-[rgba(20,31,48,0.14)] blur-[50px]" />

          <ol className="relative z-10 h-full w-full list-none">
            {renderedCards.map(({ item, itemIndex, offset, slot, isVisible, isActive }) => {
              const artworkState = readArtwork(item.soundcloudUrl);
              const fallbackArt = getFallbackArt(item.title);
              const showMediaActions = enableMediaActions && isActive;

              return (
                <motion.li
                  key={`${item.id}-${offset}-${displayMode}`}
                  initial={false}
                  animate={{ x: slot.x, y: slot.y, rotate: prefersReducedMotion ? slot.rotate * 0.55 : slot.rotate, scale: slot.scale, opacity: slot.opacity }}
                  transition={transition}
                  style={{ zIndex: slot.zIndex, left: '50%', top: '46%' }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  aria-hidden={slot.ariaHidden ? true : undefined}
                >
                  {showMediaActions ? (
                    <motion.div
                      ref={(node) => {
                        activeCardFrameRef.current = node;
                      }}
                      drag="x"
                      dragDirectionLock
                      dragElastic={prefersReducedMotion ? 0.08 : 0.12}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragSnapToOrigin
                      onDragEnd={handleDragEnd}
                      className={[
                        'group relative w-[clamp(14rem,62vw,21.5rem)] rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(244,248,252,0.96)_100%)] p-4 text-left shadow-[0_36px_76px_rgba(15,23,42,0.2)] transition-[box-shadow,border-color,background-color] sm:w-[clamp(15rem,38vw,20rem)] lg:w-[clamp(16rem,23vw,21rem)]',
                        'cursor-grab active:cursor-grabbing',
                      ].join(' ')}
                      style={{ touchAction: 'pan-x pinch-zoom' }}
                    >
                      <span className="pointer-events-none absolute inset-0 rounded-[2rem] border border-black/4" />
                      <div className="pointer-events-none absolute inset-x-[13%] bottom-0 h-10 rounded-full bg-[rgba(15,23,42,0.12)] blur-[24px]" />

                      <button
                        ref={activeCardRef}
                        type="button"
                        onClick={() => openExternalUrl(item.primaryOpenUrl)}
                        className="group/art relative block w-full overflow-hidden rounded-[1.35rem] border border-black/6 bg-[var(--brand-page-bg-strong)] text-left shadow-[0_16px_38px_rgba(15,23,42,0.1)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(15,23,42,0.14)] focus-visible:ring-4 focus-visible:ring-[var(--brand-focus)] cursor-pointer"
                        aria-label={`Open ${item.title} on SoundCloud, or YouTube if SoundCloud is unavailable`}
                      >
                        <div className="relative aspect-square" style={fallbackArt}>
                          {artworkState.status === 'ready' ? (
                            <Image
                              src={artworkState.artwork}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 23vw"
                              className="object-cover"
                              loading={isVisible ? 'eager' : 'lazy'}
                              preload={isActive}
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_24%,rgba(9,16,28,0.1)_68%,rgba(9,16,28,0.24)_100%)]" />
                          <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.24)_0,rgba(255,255,255,0.24)_1px,transparent_1px,transparent_10px)]" />
                          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/16 to-transparent" />
                        </div>
                      </button>

                      <div className="mt-4 px-1">
                        <h2 className="text-pretty text-[1.18rem] font-medium leading-6 tracking-[-0.03em] text-[color:var(--brand-text)] sm:text-[1.24rem]">
                          {item.title}
                        </h2>
                      </div>

                      <div className="mt-4 flex items-center justify-center gap-4 pb-1">
                          <button
                            type="button"
                            onClick={() => openExternalUrl(item.soundcloudUrl)}
                            disabled={!item.soundcloudUrl}
                            className={activePlatformButtonClass}
                            aria-label={item.soundcloudUrl ? `Open ${item.title} on SoundCloud` : `SoundCloud unavailable for ${item.title}`}
                            title={item.soundcloudUrl ? 'Open on SoundCloud' : 'SoundCloud unavailable'}
                          >
                            <SCIcon />
                          </button>

                          <button
                            type="button"
                            onClick={() => openExternalUrl(item.youtubeUrl)}
                            disabled={!item.youtubeUrl}
                            className={activePlatformButtonClass}
                            aria-label={item.youtubeUrl ? `Open ${item.title} on YouTube` : `YouTube unavailable for ${item.title}`}
                            title={item.youtubeUrl ? 'Open on YouTube' : 'YouTube unavailable'}
                          >
                            <YouTubeIcon />
                          </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      ref={
                        isActive
                          ? (node) => {
                              activeCardRef.current = node;
                              activeCardFrameRef.current = node;
                            }
                          : null
                      }
                      type="button"
                      drag={isActive ? 'x' : false}
                      dragDirectionLock={isActive}
                      dragElastic={prefersReducedMotion ? 0.08 : 0.12}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragSnapToOrigin
                      onDragEnd={isActive ? handleDragEnd : undefined}
                      onClick={() => {
                        if (!isActive) moveToIndex(itemIndex, 'pointer');
                      }}
                      tabIndex={isVisible ? 0 : -1}
                      aria-label={isActive ? `${item.title}, active sleeve` : item.title}
                      className={[
                        'group relative w-[clamp(12.4rem,56vw,18.4rem)] rounded-[1.28rem] p-3 text-left shadow-[0_28px_60px_rgba(15,23,42,0.16)] outline-none transition-[box-shadow,border-color,background-color] focus-visible:ring-4 focus-visible:ring-[var(--brand-focus)] sm:w-[clamp(13rem,33vw,17.25rem)] lg:w-[clamp(13.5rem,20vw,17.5rem)]',
                        'border border-[color:var(--brand-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,253,0.96)_100%)]',
                        isActive ? 'cursor-grab active:cursor-grabbing' : isVisible ? 'cursor-pointer hover:border-[color:var(--brand-border-strong)]' : 'pointer-events-none',
                      ].join(' ')}
                      style={{ touchAction: isActive ? 'pan-x pinch-zoom' : 'auto' }}
                    >
                      <span className="pointer-events-none absolute inset-0 rounded-[1.28rem] border border-black/4" />

                      <div className="relative aspect-square overflow-hidden rounded-[0.94rem] border border-black/6 bg-[var(--brand-page-bg-strong)]" style={fallbackArt}>
                        {artworkState.status === 'ready' ? (
                          <Image
                            src={artworkState.artwork}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 56vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover"
                            loading={isActive ? undefined : isVisible ? 'eager' : 'lazy'}
                            preload={isActive}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_26%,rgba(7,14,24,0.08)_68%,rgba(7,14,24,0.18)_100%)]" />
                        <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.26)_0,rgba(255,255,255,0.26)_1px,transparent_1px,transparent_10px)]" />
                        <div className="absolute inset-x-0 bottom-0 h-[4.5rem] bg-gradient-to-t from-white/36 to-transparent" />
                      </div>

                      {slot.showTitle ? (
                        <div className="mt-3 min-h-[3.5rem] px-1">
                          <h2 className="text-pretty text-[1rem] font-medium leading-5 tracking-[-0.025em] text-[color:var(--brand-text)]">
                            {item.title}
                          </h2>
                        </div>
                      ) : null}
                    </motion.button>
                  )}
                </motion.li>
              );
            })}
          </ol>

          <div className="pointer-events-none absolute inset-y-0 left-[2%] right-[2%] z-20 hidden md:block">
            <button type="button" onClick={() => moveBy(-1, 'button')} className={`${navButtonClass} pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2`} aria-label="Show previous record" disabled={deckItems.length <= 1}>
              &#8592;
            </button>
            <button type="button" onClick={() => moveBy(1, 'button')} className={`${navButtonClass} pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2`} aria-label="Show next record" disabled={deckItems.length <= 1}>
              &#8594;
            </button>
          </div>
        </div>

        <div className={`flex justify-center ${selectorClassName}`.trim()}>
          <label className="sr-only" htmlFor="record-bin-genre">Filter by genre</label>
          <div className="relative">
            <select
              id="record-bin-genre"
              aria-label="Filter by genre"
              value={activeGenre}
              onChange={handleGenreChange}
              className="appearance-none rounded-full border border-[color:var(--brand-border)] bg-white/88 px-4 py-2 pr-10 text-sm text-[color:var(--brand-text)] shadow-[0_16px_32px_rgba(15,23,42,0.12)] transition hover:border-[color:var(--brand-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-page-bg)]"
            >
              {genreOptions.map((genre) => (
                <option key={genre} value={genre} className="bg-white text-[color:var(--brand-text)]">
                  {genre}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[color:var(--brand-text-muted)]">
              &#9662;
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 md:hidden">
          <button type="button" onClick={() => moveBy(-1, 'button')} className={navButtonClass} aria-label="Show previous record" disabled={deckItems.length <= 1}>
            &#8592;
          </button>
          <button type="button" onClick={() => moveBy(1, 'button')} className={navButtonClass} aria-label="Show next record" disabled={deckItems.length <= 1}>
            &#8594;
          </button>
        </div>
      </div>
    </section>
  );
}
