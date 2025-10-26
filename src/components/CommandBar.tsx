'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "@/context/PlayerProvider";
import type { Row } from "@/lib/types";
import { SearchIcon } from "@/components/icons";
import { copyToClipboard } from "@/lib/utils";

export default function CommandBar({ rows, onNavigate }: { rows: Row[]; onNavigate: (r: 'home'|'list'|'serve'|'heatmaps'|'suggest') => void }) {
  const [open,setOpen]=useState(false); const [q,setQ]=useState(""); const inputRef=useRef<HTMLInputElement|null>(null); const [sel,setSel]=useState(0);
  const { play, enqueue }=usePlayer();
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{
    const target=e.target as HTMLElement|null;
    const typing=!!(target&&(target.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(target.tagName)||target.getAttribute("role")==="textbox"));
    if((e.key==="k"||e.key==="K")&&(e.metaKey||e.ctrlKey)&&!e.altKey){
      e.preventDefault();
      if(!typing) setOpen(v=>!v);
      return;
    }
    if(e.key==="Escape") setOpen(false);
  }; window.addEventListener("keydown",onKey); return()=>window.removeEventListener("keydown",onKey);},[]);
  useEffect(()=>{if(open) setTimeout(()=>inputRef.current?.focus(),0); else{setQ("");setSel(0);}},[open]);
  const filtered=useMemo(()=>{const term=q.toLowerCase().trim(); const base=term?rows.filter(r=>r.set.toLowerCase().includes(term)||(r.classification||"").toLowerCase().includes(term)):rows; return base.slice(0,8);},[q,rows]);
  const pageActions=useMemo(()=>[
    {label:"Home",action:()=>onNavigate("home")},
    {label:"The list",action:()=>onNavigate("list")},
    {label:"Serve up a set",action:()=>onNavigate("serve")},
    {label:"Heatmaps",action:()=>onNavigate("heatmaps")},
    {label:"Suggest a set",action:()=>onNavigate("suggest")},
  ],[onNavigate]);
  const onKeyDown=(e:React.KeyboardEvent)=>{if(e.key==="ArrowDown"){setSel(i=>Math.min(i+1,filtered.length-1));e.preventDefault();} if(e.key==="ArrowUp"){setSel(i=>Math.max(i-1,0));e.preventDefault();} if(e.key==="Enter"){const row=filtered[sel]; if(!row) return; if(e.metaKey||e.ctrlKey){const t=row.youtube||row.soundcloud||"#"; window.open(t,"_blank","noopener,noreferrer");} else {play(row); setOpen(false);}}};
  return (
    <>
      <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="mx-auto mt-24 w-[92vw] max-w-2xl rounded-2xl border border-white/10 bg-[var(--ash)]/60 backdrop-blur-xl overflow-hidden"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <SearchIcon />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="type to search sets or jump to a page"
                className="w-full bg-transparent outline-none placeholder-white/50"
              />
              <kbd className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-md">esc</kbd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="max-h-[40vh] overflow-auto">
                <div className="px-4 py-2 text-xs uppercase tracking-widest opacity-70">pages</div>
                {pageActions.map(it => (
                  <button
                    key={it.label}
                    onClick={() => { it.action(); setOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 hover-lift"
                  >
                    {it.label}
                  </button>
                ))}
              </div>
              <div className="max-h-[40vh] overflow-auto">
                <div className="px-4 py-2 text-xs uppercase tracking-widest opacity-70">sets</div>
                {filtered.map((r, i) => (
                  <div
                    key={r.set}
                    className={`px-4 py-2 ${i === sel ? "bg-white/10" : "hover:bg-white/10"}`}
                    onMouseEnter={() => setSel(i)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.set}</div>
                        <div className="text-xs opacity-70 capitalize truncate">{(r.classification || "").toLowerCase() || "unknown"}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="btn-secondary hover-lift" onClick={() => enqueue(r)}>queue</button>
                        <button className="btn-secondary hover-lift" onClick={() => copyToClipboard(r.youtube || r.soundcloud || "")}>copy</button>
                        <button className="btn-secondary hover-lift" onClick={() => {
                          const t = r.youtube || r.soundcloud || "#";
                          window.open(t, "_blank", "noopener,noreferrer");
                        }}>open</button>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && <div className="px-4 py-3 text-sm opacity-70">no results</div>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
