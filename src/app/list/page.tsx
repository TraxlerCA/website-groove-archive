// src/app/list/page.tsx
'use client';

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { IconButton, PageTitle, Switch, Tag } from "@/components/ui";
import { YouTubeIcon, SCIcon, SearchIcon } from "@/components/icons";
import { usePlayer } from "@/context/PlayerProvider";
import { useRows } from "@/lib/useRows";

const ROW_COLS = "grid grid-cols-[1.5rem_minmax(0,1fr)_auto_auto] items-center gap-3";

export default function ListPage() {
  const { rows, loading } = useRows();
  const { play } = usePlayer();

  const [q, setQ] = useState("");
  const [sOnly, setSOnly] = useState(false);
  const [medium, setMedium] = useState<"any" | "youtube" | "soundcloud">("any");
  const [genre, setGenre] = useState("any");

  const genres = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => { const g = (r.classification || "").trim(); if (g) s.add(g); });
    return ["any", ...Array.from(s).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      if (sOnly && (r.tier || "").toUpperCase() !== "S") return false;
      if (genre !== "any" && r.classification !== genre) return false;
      if (medium === "youtube" && !r.youtube) return false;
      if (medium === "soundcloud" && !r.soundcloud) return false;
      if (!term) return true;
      const hay = `${r.set} ${(r.classification || "")} ${(r.tier || "")}`.toLowerCase();
      return term.split(/\s+/).filter(Boolean).every(w => hay.includes(w));
    });
  }, [rows, q, sOnly, genre, medium]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: loading ? 20 : filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  return (
    <section className="container mx-auto max-w-6xl px-6 mt-10 space-y-10">
      <PageTitle title="THE LIST" />

      <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
        {/* sticky controls + aligned column labels */}
        <div className="sticky top-20 z-10 bg-white/90 backdrop-blur">
          {/* filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium tracking-widest text-neutral-500">Search</span>
              <label className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2 h-9">
                <SearchIcon />
                <input value={q} onChange={e => setQ(e.target.value)} className="outline-none text-sm w-56" placeholder="Type to filter" />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium tracking-widest text-neutral-500">Genre</span>
              <span className="relative inline-flex items-center h-9 px-3 rounded-lg border border-neutral-300 bg-white">
                <select value={genre} onChange={e => setGenre(e.target.value)} className="appearance-none bg-transparent outline-none text-sm pr-5">
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" className="absolute right-1 pointer-events-none"><path d="M5 7l5 6 5-6" fill="none" stroke="#000" strokeWidth="1.5" /></svg>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium tracking-widest text-neutral-500">Tier</span>
              <Switch checked={sOnly} onChange={() => setSOnly(v => !v)} />
              <span className="text-sm">S-tier only</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium tracking-widest text-neutral-500">Format</span>
              <span className="relative inline-flex items-center h-9 px-3 rounded-lg border border-neutral-300 bg-white">
                <select value={medium} onChange={e => setMedium(e.target.value as any)} className="appearance-none bg-transparent outline-none text-sm pr-5">
                  <option value="any">-</option>
                  <option value="youtube">YouTube</option>
                  <option value="soundcloud">SoundCloud</option>
                </select>
                <svg width="16" height="16" viewBox="0 0 20 20" className="absolute right-1 pointer-events-none"><path d="M5 7l5 6 5-6" fill="none" stroke="#000" strokeWidth="1.5" /></svg>
              </span>
            </div>
          </div>
          {/* column labels that align with rows */}
          <div className={`${ROW_COLS} text-xs font-medium text-neutral-500 px-4 py-2 border-b border-neutral-200`}>
            <div className="uppercase tracking-widest">s</div>
            <div className="uppercase tracking-widest">title</div>
            <div className="uppercase tracking-widest">genre</div>
            <div className="uppercase tracking-widest justify-self-end">links</div>
          </div>
        </div>

        {/* scroll area */}
        <div ref={parentRef} className="h-[60vh] overflow-auto">
          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map(vi => {
              const r = filtered[vi.index];
              return (
                <div key={vi.key} className="absolute left-0 right-0" style={{ transform: `translateY(${vi.start}px)` }}>
                  {loading ? (
                    <div className={`${ROW_COLS} px-4 py-3 odd:bg-white animate-pulse`}>
                      {Array.from({ length: 4 }).map((_, j) => (<div key={j} className="h-4 w-3/4 bg-neutral-200 rounded" />))}
                    </div>
                  ) : (
                    <div className={`${ROW_COLS} px-4 py-3 odd:bg-white hover:bg-blue-50/40 transition`}>
                      <div className="py-1 font-medium" style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>{(r?.tier || "").toUpperCase() || "?"}</div>
                      <div className="py-1 min-w-0">
                        <a href={r?.youtube || r?.soundcloud || "#"} className="block truncate hover:underline" title={r?.set}>{r?.set}</a>
                      </div>
                      <div className="py-1"><Tag>{(r?.classification || "").toLowerCase()}</Tag></div>
                      <div className="py-1">
                        <div className="flex items-center gap-2 justify-end">
                          {r?.youtube && (<IconButton title="play on YouTube" ariaLabel="play on YouTube" onClick={() => play(r, 'youtube')}><YouTubeIcon /></IconButton>)}
                          {r?.soundcloud && (<IconButton title="play on SoundCloud" ariaLabel="play on SoundCloud" onClick={() => play(r, 'soundcloud')}><SCIcon /></IconButton>)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 text-xs text-neutral-500">data source: published Google Sheet.</div>
      </div>
    </section>
  );
}
