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
    <div className="min-h-screen bg-brand-page text-[color:var(--brand-text)]">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/78 backdrop-blur-md shadow-[0_10px_30px_-24px_rgba(15,23,42,0.2)]">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 text-[0.62rem] uppercase tracking-[0.3em] text-[color:var(--brand-text-muted)] sm:px-6 lg:px-10">
          <Link href="/labs" className="font-semibold text-[color:var(--brand-text)] transition hover:text-neutral-700">
            The Groove Archive Labs
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/labs/record-bin" className="transition hover:text-[color:var(--brand-text)]">
              Record Bin
            </Link>
            <Link href="/" className="transition hover:text-[color:var(--brand-text)]">
              Site
            </Link>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
