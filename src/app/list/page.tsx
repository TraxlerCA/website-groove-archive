// src/app/list/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { IconButton, PageTitle } from "@/components/ui";
import { YouTubeIcon, SCIcon, SearchIcon, PaperPlaneOutlineIcon } from "@/components/icons";
import { usePlayer } from "@/context/PlayerProvider";
import { useRows } from "@/lib/useRows";
import { useGenres } from "@/lib/useGenres";
import SuggestModal from "@/components/SuggestModal";
import { motion } from 'framer-motion';
import { GenreTooltip } from '@/components/GenreTooltip';

/* title | genre | links */
/*
  Make column widths responsive to avoid overflow on small screens.
  - `title` flexes
  - `genre` shrinks on small screens but caps at 220px
  - `links` shrinks on small screens but caps at 88px
*/
const ROW_COLS =
  "grid grid-cols-[minmax(0,1fr)_clamp(7rem,28vw,220px)_clamp(5rem,18vw,88px)] items-center gap-3";

export default function ListPage() {
  const { rows, loading } = useRows();
  const { play } = usePlayer();
  const { byLabel } = useGenres();

  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("any");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestBtnRef = useRef<HTMLButtonElement | null>(null);

  const genres = useMemo(() => {
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
      if (genre !== "any" && r.classification !== genre) return false;
      if (!term) return true;
      const hay = `${r.set} ${(r.classification || "")} ${(r.tier || "")}`.toLowerCase();
      return term.split(/\s+/).filter(Boolean).every(w => hay.includes(w));
    });
  }, [rows, q, genre]);

  const explanationFor = useCallback(
    (label: string | null | undefined) => {
      if (!label) return undefined;
      return byLabel.get(label.toLowerCase()) || undefined;
    },
    [byLabel]
  );

  // Keep estimate stable; recompute after mount based on width
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const estimateSize = useCallback(() => (isNarrow ? 96 : 56), [isNarrow]);

  const rowVirtualizer = useWindowVirtualizer({
    count: loading ? 20 : filtered.length,
    estimateSize,
    overscan: 8,
  });

  return (
    <section className="container mx-auto max-w-6xl px-6 mt-10 space-y-10">
      <PageTitle title="THE LIST" />

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-visible">
        <div>
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium tracking-widest text-neutral-500">Search</span>
                <label className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2 h-9">
                  <SearchIcon />
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="outline-none text-[16px] sm:text-sm w-56"
                    placeholder="Type to filter"
                  />
                </label>
              </div>

              {/* genre dropdown */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-medium tracking-widest text-neutral-500">Genre</span>
                <div className="flex flex-col">
                  <span className="relative inline-flex items-center h-9 px-3 rounded-lg border border-neutral-300 bg-white">
                    <select
                      value={genre}
                      onChange={e => setGenre(e.target.value)}
                      className="appearance-none bg-transparent outline-none text-sm pr-5"
                    >
                      {genres.map(g => (
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

              {/* Suggest a set action */}
              <div className="ml-auto">
                <motion.button
                  ref={suggestBtnRef}
                  type="button"
                  onClick={() => setSuggestOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 h-9 text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                  aria-label="Open the suggest a set modal"
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ y: 0, scale: 0.99 }}
                >
                  <span className="-ml-1"><PaperPlaneOutlineIcon /></span>
                  <span>Suggest a set</span>
                </motion.button>
              </div>
            </div>

            {/* Column labels */}
            <div className={`${ROW_COLS} text-xs font-medium text-neutral-500 px-4 py-1.5 border-b border-neutral-200 hidden sm:grid`}>
              <div className="uppercase tracking-widest">title</div>
              <div className="uppercase tracking-widest text-center">genre</div>
              <div className="uppercase tracking-widest text-center">links</div>
            </div>
          </div>

          {/* Virtualized rows */}
          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map(vi => {
              const r = filtered[vi.index];

              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  className="absolute left-0 right-0"
                  style={{ transform: `translateY(${vi.start}px)`, height: `${vi.size}px` }}
                >
                  {loading ? (
                    <div className={`${ROW_COLS} px-4 py-3 odd:bg-white animate-pulse hidden sm:grid`}>
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="h-4 w-3/4 bg-neutral-200 rounded" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* desktop/tablet row */}
                      <div className={`${ROW_COLS} px-4 py-3 odd:bg-white hover:bg-black/5 transition hidden sm:grid`}>
                        <div className="py-2 min-w-0">
                          <a
                            href={r?.youtube || r?.soundcloud || "#"}
                            className="block truncate hover:underline"
                            title={r?.set}
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

                      {/* mobile card */}
                      <article className="sm:hidden border-b border-neutral-200 px-3 pt-3 pb-4">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium leading-snug line-clamp-2">{r?.set}</div>
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
                              <IconButton title="Play on SoundCloud" ariaLabel="Play on SoundCloud" onClick={() => play(r, "soundcloud")} variant="inverted">
                                <SCIcon />
                              </IconButton>
                            )}
                            {r?.youtube && (
                              <IconButton title="Play on YouTube" ariaLabel="Play on YouTube" onClick={() => play(r, "youtube")} variant="inverted">
                                <YouTubeIcon />
                              </IconButton>
                            )}
                          </div>
                        </div>
                      </article>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* footer removed per request */}
      </div>
      <SuggestModal open={suggestOpen} onClose={() => setSuggestOpen(false)} restoreFocusTo={suggestBtnRef.current} />
    </section>
  );
}
