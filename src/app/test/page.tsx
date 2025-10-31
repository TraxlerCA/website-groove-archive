import React from 'react';

export default function TestPage() {
  return (
    <main className="container mx-auto max-w-4xl space-y-14 px-6 py-20 sm:py-24">
      <header className="space-y-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-[#22d3ee] via-[#38bdf8] to-[#6366f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-sm shadow-cyan-500/30">
          Style Lab
        </span>
        <div className="max-w-2xl space-y-3">
          <h1 className="text-4xl font-semibold text-neutral-900 sm:text-5xl">Floating Vinyl Buttons</h1>
          <p className="text-base text-neutral-600 sm:text-lg">
            Premium variants of the floating vinyl control. Each keeps the halo ring while adding distinctive motion.
          </p>
        </div>
      </header>

      <section className="grid gap-10 sm:grid-cols-3">
        <VinylCard
          title="Orbit Halo"
          description="Rotating outer halo with soft glints, inspired by lighting on acrylic decks."
        >
          <div className="relative">
            <span className="pointer-events-none absolute inset-[-20px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.72),rgba(34,211,238,0.55),rgba(56,189,248,0.45),rgba(99,102,241,0.4),transparent_82%)] opacity-95 blur-[26px]" />
            <span className="pointer-events-none absolute inset-[-22px] animate-[orbit_10s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,rgba(255,255,255,0.65)_0deg,rgba(34,211,238,0.55)_70deg,rgba(56,189,248,0.5)_150deg,rgba(99,102,241,0.55)_250deg,rgba(255,255,255,0.65)_360deg)] opacity-85 blur-lg" />
            <VinylButton
              haloClass="animate-[spin_16s_linear_infinite]"
              overlay={
                <span className="pointer-events-none absolute inset-0 animate-[glint_4s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.78)_28deg,transparent_86deg)] opacity-0" />
              }
              centerElement={
                <span className="absolute inset-[34px] rounded-full bg-[#070d18] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]" />
              }
            />
          </div>
        </VinylCard>

        <VinylCard
          title="Pulse Rings"
          description="Concentric ripples breathe outwards, echoing sub-bass vibrations."
        >
          <div className="relative">
            <VinylButton
              haloClass="animate-[spin_20s_linear_infinite]"
              overlay={
                <>
                  <span className="pointer-events-none absolute inset-[-6px] animate-[pulse_3.4s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.55),rgba(34,211,238,0.55),rgba(56,189,248,0.45),rgba(99,102,241,0.4),transparent_78%)] opacity-90" />
                  <span className="pointer-events-none absolute inset-[6px] animate-[pulse_3.4s_ease-in-out_infinite] [animation-delay:1.2s] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),rgba(56,189,248,0.4),rgba(99,102,241,0.3),transparent_72%)] opacity-85" />
                </>
              }
            />
          </div>
        </VinylCard>

        <VinylCard
          title="Groove Sweep"
          description="Subtle groove highlights glide across the record like a stylus sweep."
        >
          <div className="relative">
            <span className="pointer-events-none absolute inset-[-18px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.6),rgba(34,211,238,0.5),rgba(99,102,241,0.4),transparent_85%)] opacity-85 blur-[24px]" />
            <VinylButton
              haloClass="animate-[spin_14s_linear_infinite]"
              overlay={
                <span className="pointer-events-none absolute inset-[10px] overflow-hidden rounded-full">
                  <span className="absolute inset-0 animate-[sweep_2.8s_ease-in-out_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(226,232,240,0.58)_30deg,rgba(99,102,241,0.45)_60deg,transparent_150deg)] opacity-80" />
                </span>
              }
            />
          </div>
        </VinylCard>
      </section>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes orbit {
          0% {
            transform: rotate(0deg) scale(1);
          }
          65% {
            transform: rotate(220deg) scale(1.06);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        @keyframes glint {
          0%,
          12%,
          100% {
            opacity: 0;
            transform: rotate(0deg);
          }
          35% {
            opacity: 1;
            transform: rotate(38deg);
          }
          60% {
            opacity: 0;
            transform: rotate(80deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.75);
          }
          45% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        @keyframes sweep {
          0% {
            transform: rotate(-20deg);
            opacity: 0;
          }
          35%,
          45% {
            opacity: 0.9;
          }
          80% {
            transform: rotate(180deg);
            opacity: 0;
          }
          100% {
            transform: rotate(200deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}

type VinylCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function VinylCard({ title, description, children }: VinylCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/55 bg-white/85 p-8 shadow-[0_32px_70px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <header className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">{title}</h2>
        <p className="text-sm text-neutral-500">{description}</p>
      </header>
      <div className="mt-10 flex justify-center">
        {children}
      </div>
    </article>
  );
}

type VinylButtonProps = {
  className?: string;
  overlay?: React.ReactNode;
  centerElement?: React.ReactNode;
  haloClass?: string;
};

function VinylButton({ className, overlay, centerElement, haloClass }: VinylButtonProps) {
  return (
    <button
      type="button"
      className={`group relative inline-flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_28px_45px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_34px_52px_rgba(14,116,144,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/45 ${className ?? ''}`}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full border border-white/30" />
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.6),rgba(56,189,248,0.38),rgba(8,47,73,0.88))] opacity-40 blur-xl" />
      <span
        className={`pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,rgba(255,255,255,0.12),rgba(34,211,238,0.4),rgba(3,7,18,0.85),rgba(255,255,255,0.12))] ${haloClass ?? ''}`}
      />
      <span className="pointer-events-none absolute inset-[6px] rounded-full border border-white/20 bg-gradient-to-br from-[#0f172a] via-[#040a13] to-[#010103]" />
      <span className="pointer-events-none absolute inset-[6px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(248,250,252,0.18),transparent_68%)] opacity-60 mix-blend-screen" />
      <span className="pointer-events-none absolute inset-[22px] rounded-full border border-white/10 bg-[#010409] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]" />
      <span className="pointer-events-none absolute inset-[12px] rounded-full bg-[repeating-radial-gradient(circle_at_center,#0f172a_0px,#0f172a_1px,transparent_1px,transparent_3px)] opacity-40 mix-blend-overlay" />
      {centerElement}
      <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#010409] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_25px_rgba(15,23,42,0.6)]">
        <svg aria-hidden="true" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M9 5v14l10-7z" />
        </svg>
      </span>
      {overlay}
    </button>
  );
}
