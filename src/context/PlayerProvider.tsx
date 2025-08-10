'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Provider, Row } from "@/lib/types";

type QueueItem={row:Row;provider:Provider};
type PlayerState={current:QueueItem|null;queue:QueueItem[];playing:boolean;progress:number;open:boolean;play:(row:Row,preferred?:Provider)=>void;toggle:()=>void;enqueue:(row:Row,preferred?:Provider)=>void;next:()=>void;setOpen:(v:boolean)=>void;};
const Ctx=createContext<PlayerState|null>(null);
export const usePlayer=()=>{const v=useContext(Ctx); if(!v) throw new Error("Player provider missing"); return v;};

const pick=(row:Row,preferred?:Provider):Provider=>preferred==='youtube'&&row.youtube?'youtube':preferred==='soundcloud'&&row.soundcloud?'soundcloud':row.soundcloud?'soundcloud':'youtube';

export function PlayerProvider({children}:{children:ReactNode}){
  const [current,setCurrent]=useState<QueueItem|null>(null),[queue,setQueue]=useState<QueueItem[]>([]),[playing,setPlaying]=useState(false),[progress,setProgress]=useState(0),[open,setOpen]=useState(false);
  useEffect(()=>{if(!playing)return;let raf=0,last=performance.now();const step=(now:number)=>{const dt=(now-last)/1000;last=now;setProgress(p=>(p+dt/1800)%1);raf=requestAnimationFrame(step);};raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);},[playing]);
  const play=useCallback((row:Row,preferred?:Provider)=>{setCurrent({row,provider:pick(row,preferred)});setPlaying(true);setOpen(true);},[]);
  const toggle=useCallback(()=>setPlaying(v=>!v),[]);
  const enqueue=useCallback((row:Row,preferred?:Provider)=>setQueue(q=>[...q,{row,provider:pick(row,preferred)}]),[]);
  const next=useCallback(()=>setQueue(q=>{const n=q[0]; if(n){setCurrent(n);setPlaying(true);setOpen(true);return q.slice(1);} setPlaying(false);return q;}),[]);
  useEffect(()=>{document.documentElement.style.setProperty("--playPulse",playing?"1":"0");},[playing]);
  return <Ctx.Provider value={{current,queue,playing,progress,open,play,toggle,enqueue,next,setOpen}}>{children}</Ctx.Provider>;
}
