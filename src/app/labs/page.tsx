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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(117,156,255,0.16),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(255,70,169,0.09),transparent_18%)]" />

      <div className="relative w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-[0.62rem] uppercase tracking-[0.34em] text-white/42">
            Unlinked experiments
          </p>
          <h1 className="max-w-2xl text-3xl font-medium tracking-[-0.04em] text-white sm:text-5xl">
            Labs for trying stronger front-page directions without touching the live site.
          </h1>
        </div>

        <div className="grid gap-4">
          {LABS.map((lab) => (
            <Link
              key={lab.href}
              href={lab.href}
              className="group rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/18 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070c]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-lg font-medium tracking-[-0.03em] text-white/92">
                    {lab.label}
                  </p>
                  <p className="max-w-xl text-sm leading-6 text-white/56">
                    {lab.note}
                  </p>
                </div>
                <span className="text-sm text-white/56 transition group-hover:translate-x-0.5 group-hover:text-white/82">
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
