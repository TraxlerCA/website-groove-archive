'use client';
import { usePlayer } from "@/context/PlayerProvider";

export function Fonts(){return(<><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;900&display=swap" rel="stylesheet"/></>);}
export const AnimatedBackdrop=()=>(<div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{background:"radial-gradient(600px at 20% 20%, rgba(183,255,46,0.07), transparent 60%), radial-gradient(600px at 80% 10%, rgba(155,231,255,0.06), transparent 60%)"}}/>);
export const IndustrialGlowTheme=()=>(<style>{`:root{--coal:#0a0b0d;--fog:#eef2f3;--ash:#1a1c20;--ice:#9be7ff;--sodium:#b7ff2e}.btn-secondary{padding:4px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);font-size:12px}.btn-secondary:disabled{opacity:.5;cursor:not-allowed}`}</style>);

export function SiteHeader({route,onSetRoute}:{route:'home'|'list'|'suggest'|'heatmaps';onSetRoute:(r:any)=>void}){
  const { playing, progress }=usePlayer();
  return (<header className="fixed top-0 left-0 w-full z-40">
    <div className="mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
      <button className="cursor-pointer select-none text-xl md:text-2xl tracking-wide font-black opacity-90 hover:opacity-100" style={{fontFamily:"'Space Grotesk', system-ui, sans-serif"}} onClick={()=>onSetRoute('home')} aria-label="go to home">the groove archive</button>
      {route!=='home'&&(<nav className="hidden md:flex gap-5 text-sm items-center">
        <button onClick={()=>onSetRoute('list')} className="opacity-80 hover:opacity-100">the list</button>
        <button onClick={()=>onSetRoute('suggest')} className="opacity-80 hover:opacity-100">suggest me a set</button>
        <button onClick={()=>onSetRoute('heatmaps')} className="opacity-80 hover:opacity-100">heatmaps</button>
        <kbd className="hidden lg:inline-block text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-md ml-2 opacity-80">k</kbd>
      </nav>)}
    </div>
    <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--sodium)]/40 to-transparent relative">
      <div className="absolute left-0 top-0 h-px bg-[var(--sodium)]/80 transition-[width] duration-300" style={{width:playing?`${Math.max(2,Math.floor(progress*100))}%`:"0%"}}/>
    </div>
  </header>);
}
