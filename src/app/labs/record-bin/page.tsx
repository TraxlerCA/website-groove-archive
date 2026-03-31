import type { Metadata } from 'next';
import Link from 'next/link';
import { buildRecordBinDeck } from '@/components/record-bin/deck';
import { RecordBinLab } from '@/components/labs/record-bin/RecordBinLab';
import { getSheets } from '@/lib/sheets.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Record Bin',
  description: 'A swipeable record-bin study built from The Groove Archive.',
};

function LabsRecordBinUnavailable() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-[1320px] items-center px-4 py-10 sm:px-6 lg:px-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-[color:var(--brand-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(242,247,252,0.94)_100%)] p-8 text-[color:var(--brand-text)] shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <p className="text-[0.62rem] uppercase tracking-[0.34em] text-[color:var(--brand-text-muted)]">
          Record Bin Offline
        </p>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em] text-[color:var(--brand-text)]">
          The archive data did not load for this lab.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--brand-text-muted)]">
          The live site is untouched. This labs route just needs the archive rows to build the sleeve stack.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/labs"
            className="rounded-full border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/15"
          >
            Back to labs
          </Link>
          <Link
            href="/"
            className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:-translate-y-0.5 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/10"
          >
            Back to site
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function LabsRecordBinPage() {
  const sheets = await getSheets(['list']);

  if (!sheets.ok) {
    return <LabsRecordBinUnavailable />;
  }

  const rows = sheets.data.list ?? [];
  const deck = buildRecordBinDeck(rows);

  if (deck.length < 3) {
    return <LabsRecordBinUnavailable />;
  }

  return <RecordBinLab items={deck} />;
}
