// src/components/Header.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ResourceHints() {
  return (
    <>
      <link rel="preconnect" href="https://i.ytimg.com"/>{/* speed up thumbs */}
      <link rel="preconnect" href="https://i1.sndcdn.com"/>{/* speed up SC thumbs */}
    </>
  );
}

export function WordmarkHeader() {
  const pathname = usePathname();
  const [hideSecondary, setHideSecondary] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const shouldHide = window.scrollY > 64;
      setHideSecondary(prev => (prev === shouldHide ? prev : shouldHide));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/list', label: 'List' },
    { href: '/heatmaps', label: 'Heatmaps' },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="relative border-b border-white/50 bg-white/80 backdrop-blur-sm shadow-[0_8px_30px_-16px_rgba(0,0,0,0.45)]">
        <div className="container mx-auto flex max-w-6xl items-center justify-center px-6 pt-6 pb-5 sm:pt-7 sm:pb-5">
          <Link
            href="/"
            className="cursor-pointer select-none text-[19px] font-semibold uppercase tracking-[0.28em] text-neutral-900 transition-colors hover:text-neutral-600 sm:text-[21px]"
            aria-label="Go to home"
          >
            The Groove Archive
          </Link>
        </div>
        <div className="pointer-events-none mx-auto mb-2 h-[1.5px] w-[min(320px,72vw)] rounded-full bg-[linear-gradient(90deg,var(--accent)_0%,rgba(0,0,0,0.18)_55%,transparent_100%)] opacity-80" />
      </div>

      <div
        className={`mx-4 overflow-hidden rounded-b-3xl border border-white/60 bg-white/75 backdrop-blur-md shadow-[0_10px_32px_-24px_rgba(0,0,0,0.45)] transition-all duration-300 ${
          hideSecondary ? 'max-h-0 border-white/10 opacity-0' : 'max-h-24 opacity-100'
        }`}
      >
        <div
          className={`container mx-auto flex max-w-6xl flex-col gap-2 px-6 transition-all duration-300 ${
            hideSecondary ? 'py-0' : 'py-3'
          } sm:flex-row sm:items-center sm:gap-5`}
        >
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-neutral-600">
            {navLinks.map(link => {
              const isActive =
                pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition hover:text-neutral-900 ${
                    isActive ? 'text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="sm:ml-auto w-full sm:w-auto">
            <Link
              href="/suggest"
              className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/15"
            >
              Suggest
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
