// src/components/Header.tsx
'use client';
import Link from 'next/link';

export function Fonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
      <link rel="preconnect" href="https://i.ytimg.com"/>{/* speed up thumbs */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;900&display=swap" rel="stylesheet"/>
    </>
  );
}

export function WordmarkHeader() {
  return (
    <header className="pt-8">
      <style>{`
        .wmk{position:relative;display:inline-block}
        .wmk::before,.wmk::after{content:"";position:absolute;left:50%;top:50%;border-radius:9999px;pointer-events:none;opacity:0;filter:blur(22px)}
        .wmk::before{width:200%;height:300%;transform:translate(-50%,-50%) scale(.94);background:radial-gradient(closest-side,rgba(37,99,235,.48),transparent 74%)}
        .wmk::after{width:150%;height:200%;transform:translate(-50%,-50%) scale(.94);background:radial-gradient(closest-side,rgba(37,99,235,.76),transparent 72%)}
        .wmk:hover::before,.wmk:hover::after{opacity:1;animation:heartbeat .9s ease-in-out infinite}
        @keyframes heartbeat{0%,100%{transform:translate(-50%,-50%) scale(.96)}25%{transform:translate(-50%,-50%) scale(1.14)}55%{transform:translate(-50%,-50%) scale(1.01)}}
      `}</style>

      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center">
          <Link href="/" className="wmk cursor-pointer select-none" aria-label="Go to home">
            <span className="text-2xl sm:text-3xl font-semibold tracking-[0.25em] inline-block" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
              THE GROOVE ARCHIVE
            </span>
          </Link>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-black/30 to-transparent"/>
      </div>
    </header>
  );
}
