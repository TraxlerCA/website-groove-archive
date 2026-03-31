import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'Labs',
    template: '%s | The Groove Archive Labs',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070c] text-[#f2f5fb]">
      <header className="relative z-10 border-b border-white/8 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 text-[0.62rem] uppercase tracking-[0.34em] text-white/42 sm:px-6 lg:px-10">
          <Link href="/labs" className="transition hover:text-white/76">
            The Groove Archive Labs
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/labs/record-bin" className="transition hover:text-white/76">
              Record Bin
            </Link>
            <Link href="/" className="transition hover:text-white/76">
              Site
            </Link>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
