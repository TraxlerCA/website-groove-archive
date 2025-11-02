'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import { IconButton } from "@/components/ui";
import { YouTubeIcon, SCIcon, SearchIcon, PaperPlaneOutlineIcon } from "@/components/icons";
import { usePlayerActions } from "@/context/PlayerProvider";
import SuggestModal from "@/components/SuggestModal";
import { GenreTooltip } from "@/components/GenreTooltip";
import type { Genre, Row } from "@/lib/types";
import { useSearchParams } from "next/navigation";

const ROW_COLS =
  "grid grid-cols-[minmax(0,1fr)_clamp(7rem,28vw,220px)_clamp(5rem,18vw,88px)] items-center gap-3";

type Props = {
  rows: Row[];
  genres: Genre[];
};

export default function ListPageClient({ rows, genres }: Props) {
  const { play } = usePlayerActions();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [genre, setGenre] = useState("any");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const next = searchParams.get("q") ?? "";
    setQ(prev => (prev === next ? prev : next));
  }, [searchParams]);

  const genreOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => {
      const g = (r.classification || "").trim();
      if (g) s.add(g);
    });
    return ["any", ...Array.from(s).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      const classification = (r.classification || "").trim();
      if (genre !== "any" && classification !== genre) return false;
      if (!term) return true;
      const hay = `${r.set} ${classification} ${(r.tier || "")}`.toLowerCase();
      return term.split(/\s+/).filter(Boolean).every(w => hay.includes(w));
    });
  }, [rows, q, genre]);

  const byLabel = useMemo(() => {
    const m = new Map<string, string>();
    genres.forEach(g => {
      if (g.label) m.set(g.label.toLowerCase(), g.explanation);
    });
    return m;
  }, [genres]);

  const explanationFor = useCallback(
    (label: string | null | undefined) => {
      if (!label) return undefined;
      return byLabel.get(label.toLowerCase()) || undefined;
    },
    [byLabel],
  );

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const estimateSize = useCallback(() => (isNarrow ? 96 : 56), [isNarrow]);

  const rowVirtualizer = useWindowVirtualizer({
    count: filtered.length,
    estimateSize,
    overscan: 8,
  });

  return (
    <section className="container mx-auto max-w-6xl px-6 mt-8 sm:mt-10 space-y-10">
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-visible">
        <div>
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-b border-neutral-200">
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-neutral-500/80">Search</span>
                <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2 sm:w-auto">
                  <SearchIcon />
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="w-full bg-transparent text-base font-medium text-neutral-900 outline-none placeholder:text-neutral-400 sm:w-56 sm:text-sm sm:font-normal"
                    placeholder="Type to filter"
                  />
                </label>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-neutral-500/80">Genre</span>
                <div className="flex flex-col">
                  <span className="relative inline-flex items-center h-9 px-3 rounded-lg border border-neutral-300 bg-white">
                    <select
                      value={genre}
                      onChange={e => setGenre(e.target.value)}
                      className="appearance-none bg-transparent pr-5 text-sm font-medium text-neutral-900 outline-none"
                    >
                      {genreOptions.map(g => (
                        <option key={g} value={g}>
                          {g === "any" ? "Any" : g}
                        </option>
                      ))}
                    </select>
                    <svg width="16" height="16" viewBox="0 0 20 20" className="absolute right-1 pointer-events-none">
                      <path d="M5 7l5 6 5-6" fill="none" stroke="#000" strokeWidth="1.5" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="ml-auto">
                <motion.button
                  ref={suggestBtnRef}
                  type="button"
                  onClick={() => setSuggestOpen(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-xs font-semibold uppercase tracking-[0.22em] text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                  aria-label="Open the suggest a set modal"
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ y: 0, scale: 0.99 }}
                >
                  <span className="-ml-1">
                    <PaperPlaneOutlineIcon />
                  </span>
                  <span>Suggest a set</span>
                </motion.button>
              </div>
            </div>

            <div
              className={`${ROW_COLS} hidden border-b border-neutral-200 px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-neutral-500 sm:grid`}
            >
              <div>title</div>
              <div className="text-center">genre</div>
              <div className="text-center">links</div>
            </div>
          </div>

          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map(vi => {
              const r = filtered[vi.index];
              const primaryLink = r?.youtube ?? r?.soundcloud ?? null;
              const disabledLink = !primaryLink;

              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute left-0 right-0"
                  style={{ transform: `translateY(${vi.start}px)` }}
                >
                  {/* desktop/tablet row */}
                  <div
                    className={`${ROW_COLS} px-4 py-3 odd:bg-white hover:bg-black/5 transition hidden sm:grid rounded-md group focus-within:ring-2 focus-within:ring-black/10`}
                  >
                    <div className="py-2 min-w-0">
                      <a
                        href={primaryLink || "#"}
                        className="block truncate text-[0.98rem] font-medium text-neutral-900 transition-colors group-hover:text-neutral-700 group-hover:underline focus:text-neutral-700 focus:underline"
                        title={r?.set}
                        aria-disabled={disabledLink || undefined}
                        tabIndex={disabledLink ? -1 : undefined}
                      >
                        {r?.set}
                      </a>
                    </div>

                    <div className="py-1 flex justify-center">
                      {(() => {
                        const label = (r?.classification || "").trim();
                        if (!label) return <div className="h-6" />;
                        return <GenreTooltip label={label} description={explanationFor(label)} />;
                      })()}
                    </div>

                    <div className="py-1">
                      <div className="grid grid-cols-2 w-[88px] mx-auto place-items-center">
                        {r?.soundcloud ? (
                          <IconButton
                            title="play on SoundCloud"
                            ariaLabel="play on SoundCloud"
                            onClick={() => play(r, "soundcloud")}
                            variant="inverted"
                          >
                            <SCIcon />
                          </IconButton>
                        ) : (
                          <span className="w-11 h-11" />
                        )}

                        {r?.youtube ? (
                          <IconButton
                            title="play on YouTube"
                            ariaLabel="play on YouTube"
                            onClick={() => play(r, "youtube")}
                            variant="inverted"
                          >
                            <YouTubeIcon />
                          </IconButton>
                        ) : (
                          <span className="w-11 h-11" />
                        )}
                      </div>
                    </div>
                  </div>

                  <article className="sm:hidden border-b border-neutral-200 px-3 pt-3 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold leading-snug line-clamp-2 text-neutral-900">{r?.set}</div>
                        {(() => {
                          const label = (r?.classification || "").trim();
                          if (!label) return <div className="mt-1 h-6" />;
                          return (
                            <div className="mt-1">
                              <GenreTooltip label={label} description={explanationFor(label)} />
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {r?.soundcloud && (
                          <IconButton
                            title="Play on SoundCloud"
                            ariaLabel="Play on SoundCloud"
                            onClick={() => play(r, "soundcloud")}
                            variant="inverted"
                          >
                            <SCIcon />
                          </IconButton>
                        )}
                        {r?.youtube && (
                          <IconButton
                            title="Play on YouTube"
                            ariaLabel="Play on YouTube"
                            onClick={() => play(r, "youtube")}
                            variant="inverted"
                          >
                            <YouTubeIcon />
                          </IconButton>
                        )}
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <SuggestModal open={suggestOpen} onClose={() => setSuggestOpen(false)} restoreFocusTo={suggestBtnRef.current} />
    </section>
  );
}
