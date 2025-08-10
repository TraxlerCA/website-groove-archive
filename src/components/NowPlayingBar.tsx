'use client';
import { usePlayer } from "@/context/PlayerProvider";
import { PlayIcon } from "@/components/icons";

export default function NowPlayingBar(){
  const { current, playing, toggle, next, queue, setOpen }=usePlayer(); if(!current) return null;
  return (<div className="fixed bottom-0 left-0 right-0 z-40 px-3 md:px-6 pb-3"><div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"><div className="flex items-center gap-3 px-3 py-2">
    <button className="w-8 h-8 rounded-full bg-[var(--sodium)]/20 border border-[var(--sodium)]/60 grid place-items-center" onClick={toggle} aria-label="toggle play">{playing?(<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>):(<PlayIcon/>)}</button>
    <div className="flex-1 min-w-0"><div className="truncate text-sm font-semibold">{current.row.set}</div><div className="text-xs opacity-70 capitalize">{(current.row.classification||"").toLowerCase()}</div></div>
    <div className="flex items-center gap-2"><span className="text-xs opacity-70">{current.provider}</span><button className="btn-secondary" onClick={()=>setOpen(true)}>open</button><button className="btn-secondary" onClick={next} disabled={queue.length===0}>next</button></div>
  </div></div></div>);
}
