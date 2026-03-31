import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Labs',
  description: 'Unlinked interface experiments for The Groove Archive.',
};

const LABS = [
  {
    href: '/labs/record-bin',
    label: 'Record Bin',
    note: 'Swipeable sleeve stack built from the archive itself.',
  },
];

export default function LabsIndexPage() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-[1400px] items-center px-4 py-10 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-brand-hero" />

      <div className="relative w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-[0.62rem] uppercase tracking-[0.34em] text-[color:var(--brand-text-muted)]">
            Unlinked experiments
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[color:var(--brand-text)] sm:text-5xl">
            Labs for trying stronger front-page directions without touching the live site.
          </h1>
        </div>

        <div className="grid gap-4">
          {LABS.map((lab) => (
            <Link
              key={lab.href}
              href={lab.href}
              className="group rounded-[1.6rem] border border-[color:var(--brand-border)] bg-white/82 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-[color:var(--brand-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-page-bg)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-lg font-medium tracking-[-0.03em] text-[color:var(--brand-text)]">
                    {lab.label}
                  </p>
                  <p className="max-w-xl text-sm leading-6 text-[color:var(--brand-text-muted)]">
                    {lab.note}
                  </p>
                </div>
                <span className="text-sm text-[color:var(--brand-text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--brand-text)]">
                  Open
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
