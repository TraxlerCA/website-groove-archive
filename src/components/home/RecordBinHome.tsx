'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { buildRecordBinDeck } from '@/components/record-bin/deck';
import { RecordBinExperience } from '@/components/record-bin/RecordBinExperience';
import { useSiteData } from '@/context/SiteDataContext';

export default function RecordBinHome() {
  const siteData = useSiteData();
  const deck = useMemo(() => buildRecordBinDeck(siteData.rows), [siteData.rows]);

  if (deck.length < 3) {
    return (
      <section className="container mx-auto max-w-5xl px-6 pt-8 pb-14 sm:pt-10">
        <div className="overflow-hidden rounded-[2rem] border border-[color:var(--brand-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(242,247,252,0.94)_100%)] p-8 shadow-[0_28px_70px_rgba(15,23,42,0.12)] sm:p-10">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-text-muted)]">
            Record Bin
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[color:var(--brand-text)] sm:text-4xl">
            The archive needs a little more data before this homepage mode can render.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--brand-text-muted)] sm:text-base">
            The archive is available, but there are not enough eligible media links to build the sleeve stack right now.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/list"
              className="rounded-full border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/20"
            >
              Browse the list
            </Link>
            <Link
              href="/suggest"
              className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/10"
            >
              Suggest a set
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <RecordBinExperience
      items={deck}
      minHeight="calc(100svh - var(--tga-header-height))"
      eyebrow={null}
      title="Flip through the archive until one feels right."
      description={null}
      selectorClassName="lg:-mt-16 xl:-mt-20"
    />
  );
}
