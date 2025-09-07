'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePlayer } from "@/context/PlayerProvider";
import { ytid } from "@/lib/utils";

// Minimal typings for the YouTube IFrame API and SoundCloud Widget API
type YTOnStateChangeEvent = { data?: number };
type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  loadVideoById: (id: string) => void;
  destroy?: () => void;
};
type YTPlayerConfig = {
  videoId: string;
  playerVars?: Record<string, unknown>;
  events?: {
    onReady?: () => void;
    onStateChange?: (e: YTOnStateChangeEvent) => void;
  };
};
type SCWidget = {
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  load: (url: string, options?: Record<string, unknown>) => void;
  bind: (event: string, listener: (e?: unknown) => void) => void;
  unbind: (event: string, listener: (e?: unknown) => void) => void;
  getDuration: (cb: (ms: number) => void) => void;
};

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, config: YTPlayerConfig) => YTPlayer };
    SC?: { Widget: ((iframe: HTMLIFrameElement) => SCWidget) & { Events: { PLAY: string; PAUSE: string; PLAY_PROGRESS: string } } };
  }
}

// --- Lightweight script loader that waits until `check()` is true
function loadScriptOnce(src:string, check:()=>boolean):Promise<void>{
  if (typeof window === 'undefined') return Promise.resolve();
  if (check()) return Promise.resolve();
  return new Promise((resolve, reject)=>{
    const tryResolve=()=>{ if(check()){ resolve(); return true; } return false; };
    if (tryResolve()) return;
    const existing=[...document.getElementsByTagName('script')].some(s=>s.src===src);
    const startPolling=()=>{
      const t=setInterval(()=>{ if(check()){ clearInterval(t); resolve(); } },50);
    };
    if(existing){ startPolling(); return; }
    const s=document.createElement('script'); s.src=src; s.async=true;
    s.onload=()=>startPolling();
    s.onerror=()=>reject(new Error('Script load failed: '+src));
    document.head.appendChild(s);
  });
}

// --- YouTube Embed with IFrame API
function YouTubeEmbed({ url }: { url: string }){
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer|null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>|undefined>(undefined);
  const { registerController, setProgressAbs, setPlayingState } = usePlayer();
  const id = ytid(url) || '';

  // Initialize once
  useEffect(() => {
    let alive = true;
    const init = async () => {
      await loadScriptOnce('https://www.youtube.com/iframe_api', () => typeof window !== 'undefined' && !!window.YT?.Player);
      if (!alive || !containerRef.current) return;
      const YT = window.YT!;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await new Promise(requestAnimationFrame);
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: id,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, rel: 0, modestbranding: 1, origin },
        events: {
          onReady: () => {
            // Bridge controls once
            registerController({
              play: () => playerRef.current?.playVideo(),
              pause: () => playerRef.current?.pauseVideo(),
              seek: (seconds: number) => playerRef.current?.seekTo(seconds, true)
            });
            // Keep iframe out of tab order
            try { const i = containerRef.current?.querySelector('iframe') as HTMLIFrameElement|null; if(i) i.tabIndex = -1; } catch {}
            // Start polling once
            if (!pollRef.current) {
              pollRef.current = setInterval(() => {
                try{
                  const cur = playerRef.current?.getCurrentTime?.() || 0;
                  const dur = playerRef.current?.getDuration?.() || 0;
                  if (dur > 0) setProgressAbs(cur, dur);
                }catch{}
              }, 250);
            }
          },
          onStateChange: (e: YTOnStateChangeEvent) => {
            const st = e?.data; // -1,0,1,2,3,5
            if (st === 1) setPlayingState(true); // playing
            else if (st === 2 || st === 0) setPlayingState(false); // paused or ended
          }
        }
      });
    };
    init();
    return () => {
      alive = false;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = undefined; }
      try { registerController(null); playerRef.current?.destroy?.(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load new video on URL change without recreating player
  useEffect(() => {
    const p = playerRef.current;
    if (p && id) {
      try { p.loadVideoById(id); p.playVideo(); } catch {}
    }
  }, [id]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// --- SoundCloud Embed with Widget API
function SoundCloudEmbed({ url }: { url: string }){
  // Use a container div and imperatively create the iframe inside it.
  // This avoids React owning the exact iframe node that SC may replace,
  // preventing removeChild errors during unmount.
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeElRef = useRef<HTMLIFrameElement|null>(null);
  const widgetRef = useRef<SCWidget|null>(null);
  const durationMsRef = useRef<number>(0);
  const lastPosMsRef = useRef<number>(0);
  const durationPollRef = useRef<ReturnType<typeof setInterval>|undefined>(undefined);
  const { registerController, setProgressAbs, setPlayingState } = usePlayer();

  const onPlay = useCallback(() => setPlayingState(true), [setPlayingState]);
  const onPause = useCallback(() => setPlayingState(false), [setPlayingState]);
  const onProgress = useCallback((e?: unknown) => {
    const curMs = (e as { currentPosition?: number } | undefined)?.currentPosition || 0;
    lastPosMsRef.current = curMs;
    const totalMs = durationMsRef.current;
    if (totalMs > 0) setProgressAbs(curMs / 1000, totalMs / 1000);
  }, [setProgressAbs]);

  // Poll duration until available
  const startDurationPoll = useCallback(() => {
    const w = widgetRef.current;
    if (!w) return;
    if (durationPollRef.current) { clearInterval(durationPollRef.current); durationPollRef.current = undefined; }
    durationMsRef.current = 0;
    durationPollRef.current = setInterval(() => {
      try {
        w.getDuration((ms: number) => {
          if (ms && ms > 0) {
            durationMsRef.current = ms;
            // Update once immediately with last known position
            const cur = lastPosMsRef.current || 0;
            setProgressAbs(cur / 1000, ms / 1000);
            clearInterval(durationPollRef.current);
            durationPollRef.current = undefined;
          }
        });
      } catch {}
    }, 250);
  }, [setProgressAbs]);

  // Initialize once
  useEffect(() => {
    let alive = true;
    const init = async () => {
      await loadScriptOnce('https://w.soundcloud.com/player/api.js', () => typeof window !== 'undefined' && !!window.SC?.Widget);
      if (!alive || !containerRef.current) return;
      // Create iframe dynamically so React doesn't track it
      const iframe = document.createElement('iframe');
      iframe.title = 'SoundCloud player';
      iframe.className = 'w-full h-full';
      iframe.setAttribute('allow', 'autoplay; encrypted-media');
      iframe.tabIndex = -1;
      // Minimal base src so the widget can attach
      iframe.src = `https://w.soundcloud.com/player/?url=`;
      try { containerRef.current.appendChild(iframe); } catch {}
      iframeElRef.current = iframe;
      const SC = window.SC!;
      const widget = SC.Widget(iframe);
      widgetRef.current = widget;
      // Controller once
      registerController({
        play: () => widget?.play(),
        pause: () => widget?.pause(),
        seek: (seconds: number) => widget?.seekTo(seconds * 1000)
      });
      // Bind events once
      widget.bind(SC.Widget.Events.PLAY, onPlay);
      widget.bind(SC.Widget.Events.PAUSE, onPause);
      widget.bind(SC.Widget.Events.PLAY_PROGRESS, onProgress);
      // Load initial URL
      try {
        widget.load(url, { auto_play: true, hide_related: true, show_comments: false, show_user: false, show_reposts: false, visual: true });
        // Nudge playback explicitly in addition to auto_play for reliability
        try { widget.play(); } catch {}
        // Begin polling duration until it becomes available
        startDurationPoll();
      } catch {}
    };
    init();
    return () => {
      alive = false;
      const w = widgetRef.current;
      try {
        const SC = window.SC!;
        if (w && SC?.Widget?.Events) {
          w.unbind(SC.Widget.Events.PLAY, onPlay);
          w.unbind(SC.Widget.Events.PAUSE, onPause);
          w.unbind(SC.Widget.Events.PLAY_PROGRESS, onProgress);
        }
        if (durationPollRef.current) { clearInterval(durationPollRef.current); durationPollRef.current = undefined; }
        registerController(null);
        // Drop the iframe safely if SC mutated it (defer to avoid internal races)
        setTimeout(() => { try { if (containerRef.current) containerRef.current.innerHTML = ''; } catch {} }, 0);
        iframeElRef.current = null;
      } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load new track on URL change
  useEffect(() => {
    const w = widgetRef.current;
    if (w && url) {
      try {
        // Reset known duration and start polling again
        durationMsRef.current = 0;
        w.load(url, { auto_play: true, hide_related: true, show_comments: false, show_user: false, show_reposts: false, visual: true });
        // Explicitly request play after load to avoid stuck states
        try { w.play(); } catch {}
        startDurationPoll();
      } catch {}
    }
  }, [url, startDurationPoll]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default function PlayerModal(){
  const { current, open, setOpen, playing, toggle, durationSec, progress, seekTo }=usePlayer();

  // Persist the iframe after first open to avoid resetting playback time
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{ if(open) setMounted(true); },[open]);

  // Hydration guard: render the card only after client hydration to avoid
  // SSR/CSR markup drift from provider-driven conditionals.
  const [hydrated, setHydrated] = useState(false);
  useEffect(()=>{ setHydrated(true); },[]);

  // Show/hide with CSS so component remains mounted
  const overlayClasses = useMemo(()=>[
    'fixed inset-0 z-50 grid place-items-center p-4',
    'transition-opacity duration-200',
    open ? 'opacity-100 pointer-events-auto bg-black/75 backdrop-blur-sm' : 'opacity-0 pointer-events-none bg-black/75 backdrop-blur-sm'
  ].join(' '),[open]);

  const onBackdrop = useCallback(()=> setOpen(false), [setOpen]);

  // Utility: ignore keyboard when typing in inputs or contentEditable
  const isTypingTarget = (el: EventTarget|null) => {
    const t = el as HTMLElement | null;
    if (!t) return false;
    const tag = t.tagName;
    return t.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  };

  // Keyboard: Space toggles, Esc minimizes (keeps playing)
  useEffect(()=>{
    if(!open) return;
    const onKey=(e: KeyboardEvent)=>{
      if (isTypingTarget(e.target)) return;
      if(e.key===' '||e.code==='Space'){ e.preventDefault(); toggle(); }
      if(e.key==='Escape'){ e.preventDefault(); setOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[open, toggle, setOpen]);

  // Derived UI values
  const total = Math.max(1, durationSec || 30*60);
  const elapsedSec = Math.max(0, Math.floor((progress || 0) * total));

  const secondsToTime = (s:number)=>{
    s=Math.max(0, Math.floor(s));
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), ss=String(s%60).padStart(2,'0');
    return h>0? `${h}:${String(m).padStart(2,'0')}:${ss}` : `${m}:${ss}`;
  };

  function ProgressBar(){
    const ref=useRef<HTMLDivElement>(null);
    const pct = total>0? Math.max(0, Math.min(1, (progress||0))) : 0;
    const [hoverPct,setHoverPct]=useState<number|null>(null);
    return (
      <div
        ref={ref}
        className="relative w-full bg-white/10 rounded-md"
        style={{height:8}}
        onPointerMove={(e)=>{
          if(e.pointerType!=='mouse') return; if(!ref.current||!durationSec) return; const r=ref.current.getBoundingClientRect();
          setHoverPct(Math.min(1, Math.max(0, (e.clientX - r.left)/r.width)));
        }}
        onPointerLeave={()=>setHoverPct(null)}
        onClick={(e)=>{
          if(!ref.current||!durationSec) return; const r=ref.current.getBoundingClientRect();
          const p=(e.clientX - r.left)/r.width; seekTo(p*durationSec);
        }}
        role="slider" aria-valuemin={0} aria-valuemax={total} aria-valuenow={elapsedSec}
      >
        <div className="absolute inset-y-0 left-0 bg-white/60 rounded-md" style={{width:`${pct*100}%`}}/>
        <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow" style={{left:`${pct*100}%`}}/>
        {hoverPct!==null&& (
          <div className="pointer-events-none absolute -top-6 -translate-x-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white ring-1 ring-white/10" style={{left:`${hoverPct*100}%`}}>
            {secondsToTime((hoverPct||0)*(durationSec||0))}
          </div>
        )}
      </div>
    );
  }

  // Local UI atoms
  const PlayPauseButton = () => (
    <button
      onClick={toggle}
      className="grid place-items-center rounded-full bg-white text-neutral-900 shadow ring-1 ring-black/10 hover:opacity-95"
      style={{width:36,height:36}}
      aria-label={playing? 'Pause':'Play'}
    >
      {playing? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
      ):(
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
      )}
    </button>
  );

  function ProgressBarUI({ className = '', height = 8, rounded = 'rounded-md' }:{ className?: string; height?: number; rounded?: string }){
    const ref=useRef<HTMLDivElement>(null);
    const pct = total>0? Math.max(0, Math.min(1, (progress||0))) : 0;
    const [hoverPct,setHoverPct]=useState<number|null>(null);
    return (
      <div className={["relative w-full bg-white/10", rounded, className].filter(Boolean).join(' ')}
        style={{height}}
        ref={ref}
        onPointerMove={(e)=>{
          if(e.pointerType!=='mouse') return; if(!ref.current||!durationSec) return; const r=ref.current.getBoundingClientRect();
          setHoverPct(Math.min(1, Math.max(0, (e.clientX - r.left)/r.width)));
        }}
        onPointerLeave={()=>setHoverPct(null)}
        onClick={(e)=>{
          if(!ref.current||!durationSec) return; const r=ref.current.getBoundingClientRect();
          const p=(e.clientX - r.left)/r.width; seekTo(p*durationSec);
        }}
        role="slider" aria-valuemin={0} aria-valuemax={total} aria-valuenow={elapsedSec}
      >
        <div className={["absolute inset-y-0 left-0", rounded, "bg-white/60"].join(' ')} style={{width:`${pct*100}%`}}/>
        <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow" style={{left:`${pct*100}%`}}/>
        {hoverPct!==null&& (
          <div className="pointer-events-none absolute -top-6 -translate-x-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white ring-1 ring-white/10" style={{left:`${hoverPct*100}%`}}>
            {secondsToTime((hoverPct||0)*(durationSec||0))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={overlayClasses} aria-hidden={!open} onClick={onBackdrop}>
      <div className="relative w-full max-w-4xl aspect-video" onClick={e=>e.stopPropagation()}>
        {hydrated && (
        <div className="relative w-full max-w-4xl h-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl">
          {/* 1) top bezel */}
          <div className="absolute inset-x-0 top-0 h-14 md:h-16 px-3 flex items-center justify-between gap-3 bg-black/35 backdrop-blur supports-[backdrop-filter]:bg-black/35 z-20">
            {/* left: title */}
            <div className="min-w-0 text-white text-sm font-semibold truncate pr-2">{current?.row.set}</div>
            {/* right: controls */}
            <div className="flex items-center gap-2">
              {(() => {
                const href = current?.provider === 'youtube' ? (current?.row.youtube || '') : (current?.row.soundcloud || '');
                const enabled = !!href;
                return (
                  <a
                    href={enabled ? href : '#'}
                    target={enabled ? '_blank' : undefined}
                    rel={enabled ? 'noopener noreferrer' : undefined}
                    aria-disabled={!enabled}
                    tabIndex={enabled ? 0 : -1}
                    className={[
                      'grid h-9 w-9 place-items-center rounded-full ring-1',
                      enabled ? 'bg-white/10 text-white ring-white/20 hover:bg-white/20' : 'bg-white/5 text-white/50 ring-white/10 pointer-events-none'
                    ].join(' ')}
                    aria-label="Open on source"
                    title="Open on source"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"/>
                    </svg>
                  </a>
                );
              })()}
              <button type="button" onClick={()=>setOpen(false)} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 shadow ring-1 ring-black/10 hover:bg-white" aria-label="Minimize" title="Minimize">minimize</button>
            </div>
          </div>
        
          {/* 2) media area */}
          <div className="absolute left-0 right-0" style={{ top: '3.5rem', bottom: '6.0rem' }} tabIndex={-1}>
            {mounted && current && (current.provider==="youtube"?
              <YouTubeEmbed key="youtube" url={current.row.youtube!}/>
              : <SoundCloudEmbed key="soundcloud" url={current.row.soundcloud!}/>
            )}
          </div>

          {/* 3) bottom bezel */}
          <div className="absolute inset-x-0 bottom-0 h-24 md:h-28 px-3 flex items-center bg-black/35 backdrop-blur supports-[backdrop-filter]:bg-black/35 z-20">
            <div className="flex w-full items-center gap-3 text-white">
              <PlayPauseButton />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium leading-tight">{current?.row.set}</div>
                <ProgressBarUI className="mt-2" height={8} rounded="rounded-md" />
              </div>
              <div className="tabular-nums text-xs bg-white/90 text-neutral-900 rounded-md ring-1 ring-black/10 px-2 py-0.5 whitespace-nowrap">
                {secondsToTime(elapsedSec)} / {secondsToTime(total)}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
