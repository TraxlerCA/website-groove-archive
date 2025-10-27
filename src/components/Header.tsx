// src/components/Header.tsx
'use client';
import Link from 'next/link';
import GlobalMenu from '@/components/GlobalMenu';

export function ResourceHints() {
  return (
    <>
      <link rel="preconnect" href="https://i.ytimg.com"/>{/* speed up thumbs */}
      <link rel="preconnect" href="https://i1.sndcdn.com"/>{/* speed up SC thumbs */}
    </>
  );
}

export function WordmarkHeader() {
  return (
    <header className="pt-8">
      {/* Removed pulsating blue background/animation behind wordmark */}

      <div className="container mx-auto max-w-6xl px-6 relative">
        {/* Global menu trigger */}
        {/* Nudge in a bit on mobile so it doesn't hug the edge */}
        <div className="absolute right-2 sm:right-0 top-0 mt-2 sm:mt-0">
          <GlobalMenu />
        </div>
        <div className="text-center">
          <Link href="/" className="wmk cursor-pointer select-none" aria-label="Go to home">
            <span className="text-2xl sm:text-3xl font-semibold tracking-[0.25em] inline-block">
              THE GROOVE ARCHIVE
            </span>
          </Link>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-black/30 to-transparent"/>
      </div>
    </header>
  );
}
