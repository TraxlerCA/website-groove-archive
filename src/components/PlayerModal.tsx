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
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);
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
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: id,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, origin },
        events: {
          onReady: () => {
            // Bridge controls once
            registerController({
              play: () => playerRef.current?.playVideo(),
              pause: () => playerRef.current?.pauseVideo(),
              seek: (seconds: number) => playerRef.current?.seekTo(seconds, true)
            });
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
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SCWidget|null>(null);
  const durationMsRef = useRef<number>(0);
  const lastPosMsRef = useRef<number>(0);
  const durationPollRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const { registerController, setProgressAbs, setPlayingState } = usePlayer();

  const onPlay = useCallback(() => setPlayingState(true), [setPlayingState]);
  const onPause = useCallback(() => setPlayingState(false), [setPlayingState]);
  const onProgress = useCallback((e: { currentPosition?: number }) => {
    const curMs = e?.currentPosition || 0;
    lastPosMsRef.current = curMs;
    const totalMs = durationMsRef.current;
    if (totalMs > 0) setProgressAbs(curMs / 1000, totalMs / 1000);
  }, [setProgressAbs]);

  // Poll duration until available
  const startDurationPoll = useCallback(() => {
    const w = widgetRef.current;
    if (!w) return;
    if (durationPollRef.current) { clearInterval(durationPollRef.current); durationPollRef.current = null; }
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
            durationPollRef.current = null;
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
      if (!alive || !iframeRef.current) return;
      // Minimal base src so the widget can attach
      iframeRef.current.src = `https://w.soundcloud.com/player/?url=`;
      const SC = window.SC!;
      const widget = SC.Widget(iframeRef.current);
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
        if (durationPollRef.current) { clearInterval(durationPollRef.current); durationPollRef.current = null; }
        registerController(null);
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
        startDurationPoll();
      } catch {}
    }
  }, [url, startDurationPoll]);

  return <iframe ref={iframeRef} title="SoundCloud player" className="w-full h-full" allow="autoplay; encrypted-media" />;
}

export default function PlayerModal(){
  const { current, open, setOpen }=usePlayer();

  // Persist the iframe after first open to avoid resetting playback time
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{ if(open) setMounted(true); },[open]);

  // Show/hide with CSS so component remains mounted
  const overlayClasses = useMemo(()=>[
    'fixed inset-0 z-50 grid place-items-center p-4',
    'transition-opacity duration-200',
    open ? 'opacity-100 pointer-events-auto bg-black/75 backdrop-blur-sm' : 'opacity-0 pointer-events-none bg-black/75 backdrop-blur-sm'
  ].join(' '),[open]);

  const onBackdrop = useCallback(()=> setOpen(false), [setOpen]);

  return (
    <div className={overlayClasses} aria-hidden={!open} onClick={onBackdrop}>
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl" onClick={e=>e.stopPropagation()}>
        {/* Minimize button */}
        <div className="absolute top-2 right-2 z-10">
          <button
            type="button"
            onClick={()=>setOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 text-neutral-900 px-3 py-1 text-sm font-medium shadow ring-1 ring-black/10 hover:bg-white"
            aria-label="Minimize player"
            title="Minimize"
          >
            minimize
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
        {mounted && current && (current.provider==="youtube"?
          <YouTubeEmbed key="youtube" url={current.row.youtube!}/>
          : <SoundCloudEmbed key="soundcloud" url={current.row.soundcloud!}/>
        )}
      </div>
    </div>
  );
}
