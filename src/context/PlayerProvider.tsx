'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { Provider, Row } from "@/lib/types";

type QueueItem={row:Row;provider:Provider};
type PlayerController={ play:()=>void; pause:()=>void; seek:(seconds:number)=>void };
type PlayerState={
  current:QueueItem|null;
  queue:QueueItem[];
  playing:boolean;
  progress:number; // 0..1
  open:boolean;
  durationSec:number; // absolute duration in seconds (if known)
  play:(row:Row,preferred?:Provider)=>void;
  toggle:()=>void;
  pause:()=>void;
  resume:()=>void;
  seekTo:(seconds:number)=>void;
  enqueue:(row:Row,preferred?:Provider)=>void;
  next:()=>void;
  setOpen:(v:boolean)=>void;
  // Live-sync plumbing used by provider-aware players (YouTube/SC)
  registerController:(ctrl:PlayerController|null)=>void;
  setProgressAbs:(elapsedSec:number,totalSec:number)=>void;
  setPlayingState:(value:boolean)=>void;
};
const Ctx=createContext<PlayerState|null>(null);
export const usePlayer=()=>{const v=useContext(Ctx); if(!v) throw new Error("Player provider missing"); return v;};

const pick=(row:Row,preferred?:Provider):Provider=>preferred==='youtube'&&row.youtube?'youtube':preferred==='soundcloud'&&row.soundcloud?'soundcloud':row.soundcloud?'soundcloud':'youtube';

export function PlayerProvider({children}:{children:ReactNode}){
  const [current,setCurrent]=useState<QueueItem|null>(null),[queue,setQueue]=useState<QueueItem[]>([]),[playing,setPlaying]=useState(false),[progress,setProgress]=useState(0),[open,setOpen]=useState(false);
  // Default duration used for simulated progress + UI, overridden by live players
  const [durationSec,setDurationSec]=useState<number>(48*60 + 36);
  // When a live player registers, we stop simulating clock and delegate play/pause to it
  const controllerRef=useRef<PlayerController|null>(null);
  const [hasController,setHasController]=useState(false);
  // When a new track is requested, remember intent to start playback as
  // soon as a provider controller becomes available.
  const autoplayNextRef=useRef<boolean>(false);
  // Gate fallback clock while switching tracks so we don't show misleading time
  const [expectingController,setExpectingController]=useState(false);

  // Fallback simulated clock only if no external controller is available
  useEffect(()=>{
    if(!playing || hasController || expectingController) return; // external clock or waiting for one
    let raf=0,last=performance.now();
    const step=(now:number)=>{const dt=(now-last)/1000; last=now; setProgress(p=>Math.max(0,Math.min(1,(p+dt/Math.max(1,durationSec))%1))); raf=requestAnimationFrame(step);};
    raf=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf);
  },[playing,hasController,expectingController,durationSec]);
  const play=useCallback((row:Row,preferred?:Provider)=>{
    // Reset prior controller and progress when switching
    try{ controllerRef.current?.pause(); }catch{}
    controllerRef.current=null; setHasController(false);
    setProgress(0); setDurationSec(0); setExpectingController(true);
    // We intend to start playback once the new provider is ready
    autoplayNextRef.current = true;
    // Auto-clear expectation after short grace if no controller mounts
    setTimeout(()=>setExpectingController(false), 1500);
    setCurrent({row,provider:pick(row,preferred)});
    // Defer flipping UI to playing until the provider reports playing
    setPlaying(false);
    setOpen(true);
  },[]);
  const toggle=useCallback(()=>{
    setPlaying(v=>{
      const next=!v;
      const ctrl=controllerRef.current;
      // Persist user intent for cases where controller isn't ready yet
      autoplayNextRef.current = next;
      if(ctrl){ if(next) ctrl.play(); else ctrl.pause(); }
      return next;
    });
  },[]);
  const pause=useCallback(()=>{
    try{ controllerRef.current?.pause(); }catch{}
    autoplayNextRef.current = false;
    setPlaying(false);
  },[]);
  const resume=useCallback(()=>{
    try{ controllerRef.current?.play(); }catch{}
    autoplayNextRef.current = true;
    setPlaying(true);
  },[]);
  const seekTo=useCallback((seconds:number)=>{
    const sec=Math.max(0, seconds||0);
    try{ controllerRef.current?.seek(sec); }catch{}
    setProgress(p=>{
      const total=Math.max(1, durationSec||0);
      return Math.max(0, Math.min(1, sec/total));
    });
  },[durationSec]);
  const enqueue=useCallback((row:Row,preferred?:Provider)=>setQueue(q=>[...q,{row,provider:pick(row,preferred)}]),[]);
  const next=useCallback(()=>setQueue(q=>{const n=q[0]; if(n){
    try{ controllerRef.current?.pause(); }catch{}
    controllerRef.current=null; setHasController(false);
    setProgress(0); setDurationSec(0); setExpectingController(true);
    // We intend to continue playing the next item
    autoplayNextRef.current = true;
    setTimeout(()=>setExpectingController(false), 1500);
    setCurrent(n); setPlaying(false); setOpen(true); return q.slice(1);
  } setPlaying(false); return q;}),[]);
  useEffect(()=>{document.documentElement.style.setProperty("--playPulse",playing?"1":"0");},[playing]);
  // Removed defensive reset on current change to avoid racing real provider updates

  // Exposed helpers for live players
  const registerController=useCallback((ctrl:PlayerController|null)=>{
    controllerRef.current=ctrl;
    setHasController(!!ctrl);
    if (ctrl) {
      setExpectingController(false);
      // If a new track was requested with intent to play, kick it off now
      if (autoplayNextRef.current) {
        try { ctrl.play(); } catch {}
      }
    }
  },[]);
  const setProgressAbs=useCallback((elapsedSec:number,totalSec:number)=>{
    const total=Math.max(1,Math.floor(totalSec||0));
    const cur=Math.max(0,Math.floor(elapsedSec||0));
    setDurationSec(total);
    setProgress(total>0? Math.min(1, cur/total) : 0);
  },[]);
  const setPlayingState=useCallback((value:boolean)=>{ setPlaying(value); },[]);

  return (
    <Ctx.Provider value={{
      current,queue,playing,progress,open,durationSec,
      play,toggle,pause,resume,seekTo,enqueue,next,setOpen,
      registerController,setProgressAbs,setPlayingState
    }}>
      {children}
    </Ctx.Provider>
  );
}
