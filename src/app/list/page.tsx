'use client';

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PageTitle, FilterChip, IconButton, TierBadge } from "@/components/ui";
import { PlayIcon, YouTubeIcon, SCIcon, SearchIcon } from "@/components/icons";
import { lc } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerProvider";
import type { Row } from "@/lib/types";
import { useRows } from "@/lib/useRows";

export default function ListPage(){
  // shared dataset and loading flag, fetched once and cached in localStorage
  const { rows, loading } = useRows();

  // filters
  const [q, setQ] = useState("");
  const [sOnly, setSOnly] = useState(false);
  const [medium, setMedium] = useState<"any"|"youtube"|"soundcloud">("any");
  const [genre, setGenre] = useState("any");

  const genres = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const g = (r.classification || "").trim();
      if (!g) continue;
      map.set(g, (map.get(g) || 0) + 1);
    }
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([g])=>g);
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      if (sOnly && (r.tier || "").toUpperCase() !== "S") return false;
      if (genre !== "any" && r.classification !== genre) return false;
      if (medium === "youtube" && !r.youtube) return false;
      if (medium === "soundcloud" && !r.soundcloud) return false;
      if (!term) return true;
      const hay = `${r.set} ${r.classification || ""} ${r.tier || ""}`.toLowerCase();
      if (hay.includes(term)) return true;
      const words = term.split(/\s+/).filter(Boolean);
      return words.every(w => hay.includes(w));
    });
  }, [rows, q, sOnly, genre, medium]);

  // virtualized list
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: loading ? 20 : filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8
  });

  const { play } = usePlayer();

  return (
    <section className="relative z-20 min-h-screen px-6 md:px-10 pt-28 pb-14">
      <PageTitle title="the list" />
      {/* quick filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full md:w-96">
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="search sets, genres, tiers"
            className="w-full bg-[var(--ash)]/70 border border-white/10 rounded-xl px-10 py-2.5 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--ice)]/40"
            aria-label="search"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70"><SearchIcon/></div>
        </div>

        <span className="text-xs opacity-70 hidden md:inline">
          {loading ? "loading..." : `${filtered.length} results`}
        </span>

        <FilterChip active={sOnly} onClick={()=>setSOnly(v=>!v)}>S only</FilterChip>
        <FilterChip active={medium==="any"} onClick={()=>setMedium("any")}>any</FilterChip>
        <FilterChip active={medium==="youtube"} onClick={()=>setMedium("youtube")}>youtube</FilterChip>
        <FilterChip active={medium==="soundcloud"} onClick={()=>setMedium("soundcloud")}>soundcloud</FilterChip>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs opacity-70">genre</span>
          <select
            value={genre}
            onChange={e=>setGenre(e.target.value)}
            className="bg-[var(--ash)]/70 border border-white/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ice)]/40"
          >
            <option value="any">any</option>
            {genres.map(g=>(
              <option key={g} value={g} className="bg-[var(--coal)]">{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* table */}
      <div className="mt-6 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-[2px] bg-white/5">
        <div className="bg-[var(--coal)]">
          <div className="grid grid-cols-[1.4fr_0.3fr_0.9fr_0.6fr] gap-2 px-4 py-3 text-xs uppercase tracking-widest opacity-70">
            <div>set</div><div>tier</div><div>genre</div><div className="text-right pr-2">links</div>
          </div>
        </div>

        <div ref={parentRef} className="h-[60vh] overflow-auto">
          <div style={{height: rowVirtualizer.getTotalSize(), position: "relative"}}>
            {rowVirtualizer.getVirtualItems().map(vi => {
              const row = filtered[vi.index];
              return (
                <div key={vi.key} className="absolute left-0 right-0" style={{transform:`translateY(${vi.start}px)`}}>
                  {loading ? (
                    <div className="grid grid-cols-[1.4fr_0.3fr_0.9fr_0.6fr] gap-2 px-4 py-3 odd:bg-white/[0.03]">
                      {Array.from({length:6}).map((_,j)=>(<div key={j} className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-[1.4fr_0.3fr_0.9fr_0.6fr] gap-2 px-4 py-3 odd:bg-white/[0.03] hover:bg-white/[0.06] transition">
                      <div className="truncate" title={row?.set}>{row?.set}</div>
                      <div><TierBadge tier={row?.tier} /></div>
                      <div className="capitalize truncate" title={row?.classification||undefined}>{lc(row?.classification)}</div>
                      <div className="flex items-center justify-end gap-2">
                        <IconButton title="play here" onClick={()=>row && play(row, row.soundcloud ? "soundcloud" : "youtube")} ariaLabel="play here">
                          <PlayIcon/>
                        </IconButton>
                        {row?.youtube && (
                          <IconButton title="open on youtube" onClick={()=>window.open(row.youtube!, "_blank", "noopener,noreferrer")} ariaLabel="open youtube">
                            <YouTubeIcon/>
                          </IconButton>
                        )}
                        {row?.soundcloud && (
                          <IconButton title="open on soundcloud" onClick={()=>window.open(row.soundcloud!, "_blank", "noopener,noreferrer")} ariaLabel="open soundcloud">
                            <SCIcon/>
                          </IconButton>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 text-xs opacity-70">data source: published Google Sheet.</div>
      </div>
    </section>
  );
}
