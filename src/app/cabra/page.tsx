import type { Metadata } from 'next';
import CabraCountdown from '@/components/cabra/CabraCountdown';
import { CABRA_TARGET_LABEL } from '@/lib/cabraCountdown';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cabra',
  description: `Countdown to ${CABRA_TARGET_LABEL}.`,
  alternates: { canonical: '/cabra' },
};

export default function CabraPage() {
  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden bg-[#ece8de] text-[#171614]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: [
            'radial-gradient(circle at top left, rgba(255,255,255,0.92), rgba(255,255,255,0) 34%)',
            'linear-gradient(rgba(23,22,20,0.06) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(23,22,20,0.06) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: 'auto, 72px 72px, 72px 72px',
          backgroundPosition: '0 0, 0 0, 0 0',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(23,22,20,0.08),transparent_36%)]"
      />

      <CabraCountdown initialNow={Date.now()} />
    </main>
  );
}
