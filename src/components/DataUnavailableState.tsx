'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DataUnavailableState() {
  const router = useRouter();

  return (
    <section className="min-h-[100svh] bg-[linear-gradient(180deg,#f8fbff_0%,#eef2f7_100%)] px-6 py-16 text-neutral-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/80 bg-white/88 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-12">
          <div className="mb-4 inline-flex rounded-full bg-neutral-900 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white">
            Archive Offline
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Archive data is temporarily unavailable.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-700 sm:text-base">
            The archive could not load its current data right now. Please try refreshing in a moment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-full border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/20"
            >
              Refresh
            </button>
            <Link
              href="/"
              className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/10"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
