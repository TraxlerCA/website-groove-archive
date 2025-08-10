// src/components/Header.tsx
'use client';

export function Fonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;900&display=swap" rel="stylesheet"/>
    </>
  );
}

export function WordmarkHeader() {
  return (
    <header className="pt-8">
      <div className="container mx-auto max-w-6xl px-6">
        <h1 className="text-center text-2xl sm:text-3xl font-semibold tracking-[0.25em]" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>
          THE GROOVE ARCHIVE
        </h1>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-black/30 to-transparent"/>
      </div>
    </header>
  );
}
