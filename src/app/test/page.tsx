import React from 'react';

type Artist = {
  name: string;
  image: string;
  role?: string;
};

type Tier = {
  id: string;
  name: string;
  label: string;
  tagline: string;
  gradient: string;
  accent: string;
  frame: string;
  tickerTone: string;
  artists: Artist[];
};

const TIERS: Tier[] = [
  {
    id: 'real-good',
    name: 'Real Good',
    label: 'Headliner Status',
    tagline: 'Marquee names that sell out rooms before doors open.',
    gradient: 'from-[#fceacf]/90 via-[#e3c398]/80 to-[#a75c6b]/85',
    accent: 'bg-[#f9d178]/70 text-[#421c0d]',
    frame: 'bg-[linear-gradient(120deg,rgba(255,255,255,0.22),rgba(250,222,198,0.66),rgba(132,83,94,0.55))]',
    tickerTone: 'bg-[#3a1b2f]/90 text-[#f9d178]',
    artists: [
      {
        name: 'Luna Cascade',
        image:
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
        role: 'Synth Soul',
      },
      {
        name: 'Velvet Redux',
        image:
          'https://images.unsplash.com/photo-1468367875723-09d5f0bba81c?auto=format&fit=crop&w=400&q=80',
        role: 'Neo Funk',
      },
      {
        name: 'Royal Static',
        image:
          'https://images.unsplash.com/photo-1502851721866-69b7be8cb5b0?auto=format&fit=crop&w=400&q=80',
        role: 'Avant Rock',
      },
      {
        name: 'Mona Flux',
        image:
          'https://images.unsplash.com/photo-1525187637636-2430cd12f5e4?auto=format&fit=crop&w=400&q=80',
        role: 'Alt Pop',
      },
    ],
  },
  {
    id: 'good',
    name: 'Good',
    label: 'Late-Night Staples',
    tagline: 'Packed dance floors, cult followings, serious replay value.',
    gradient: 'from-[#1b253d]/90 via-[#31486f]/80 to-[#2f6f7c]/85',
    accent: 'bg-[#90d1c1]/70 text-[#0b2620]',
    frame: 'bg-[linear-gradient(140deg,rgba(4,10,25,0.7),rgba(67,118,134,0.55),rgba(164,231,210,0.4))]',
    tickerTone: 'bg-[#0b1a2a]/90 text-[#90d1c1]',
    artists: [
      {
        name: 'Echo Motel',
        image:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
        role: 'Alt Disco',
      },
      {
        name: 'Polychrome',
        image:
          'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=400&q=80',
        role: 'Indie Wave',
      },
      {
        name: 'Gilded Youth',
        image:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        role: 'Dream Pop',
      },
      {
        name: 'Night Parcel',
        image:
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80',
        role: 'Electro Indie',
      },
    ],
  },
  {
    id: 'ok',
    name: 'Ok',
    label: 'After-Hours Darlings',
    tagline: 'The secret weapons everyone whispers about post-show.',
    gradient: 'from-[#2b1c24]/90 via-[#3f2833]/80 to-[#6d4b3d]/85',
    accent: 'bg-[#f3b9a7]/70 text-[#3d130b]',
    frame: 'bg-[linear-gradient(120deg,rgba(242,209,200,0.4),rgba(98,64,72,0.65),rgba(33,20,24,0.55))]',
    tickerTone: 'bg-[#1f141a]/90 text-[#f3b9a7]',
    artists: [
      {
        name: 'Static Bloom',
        image:
          'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80',
        role: 'Lo-Fi R&B',
      },
      {
        name: 'Cassette Hive',
        image:
          'https://images.unsplash.com/photo-1517840545241-b491010a7a92?auto=format&fit=crop&w=400&q=80',
        role: 'Bedroom Pop',
      },
      {
        name: 'Soft Panic',
        image:
          'https://images.unsplash.com/photo-1542204637-e67bc7d41e48?auto=format&fit=crop&w=400&q=80',
        role: 'Downtempo',
      },
      {
        name: 'Night Census',
        image:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        role: 'Indie Folk',
      },
    ],
  },
];

export default function TestPage() {
  return (
    <main className="relative overflow-hidden bg-[#0b0d14] px-6 py-16 text-slate-100 sm:px-12 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,233,218,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-45">
        <div className="retro-grain" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-20">
        <header className="space-y-5 text-center sm:text-left">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.38em] text-white/80">
            Tier Showcase
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Retro Tier Tape - Artists in Varying Glow
          </h1>
          <p className="text-base text-slate-300 sm:max-w-2xl sm:text-lg">
            A retro marquee concept with slow-moving texture and floating polaroids. Scroll to compare two layout
            directions and call out the tier hierarchy before polishing the final art direction.
          </p>
        </header>

        <section className="space-y-9">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-[#f9d178]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#3f2212] shadow-[0_10px_30px_rgba(56,30,19,0.35)]">
              Concept A
            </span>
            <div className="text-sm uppercase tracking-[0.3em] text-white/60">Parallax Tape Bands</div>
          </div>

          <div className="space-y-12">
            {TIERS.map((tier) => (
              <TierBand key={tier.id} tier={tier} />
            ))}
          </div>
        </section>

        <section className="space-y-9 border-t border-white/10 pt-12">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-[#90d1c1]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#0d2823] shadow-[0_10px_30px_rgba(9,56,49,0.35)]">
              Concept B
            </span>
            <div className="text-sm uppercase tracking-[0.3em] text-white/60">Poster Wall Variation</div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {TIERS.map((tier, index) => (
              <PosterStack key={tier.id} tier={tier} index={index} />
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes retroGrain {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1.05);
          }
          33% {
            transform: translate3d(-2%, -1%, 0) scale(1.07);
          }
          66% {
            transform: translate3d(1%, 1.5%, 0) scale(1.04);
          }
        }
        @keyframes tapeDrift {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes tapeFloat {
          0%, 100% {
            transform: translateY(0px) rotate(-0.6deg);
          }
          50% {
            transform: translateY(-8px) rotate(0.6deg);
          }
        }
        @keyframes posterHover {
          0%, 100% {
            transform: translateY(0) rotate(-1deg);
          }
          50% {
            transform: translateY(-10px) rotate(1deg);
          }
        }
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .retro-grain {
          position: absolute;
          inset: -200%;
          background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRDcmVhdGlvbiBUaW1lAAfLAAABWElEQVR4nO2XwW3DMAxFX20A7KAHKADugAdoAO6AB2gA7oAHKADyQ09uZSWnQ7rLaakCSZM5Ht55d4Vp0U80JwD34dAEzjkgh1H23AArxDWPRBkMtsjit97oRGmVX6cpKoAkh5hXnuOJZoJ8x4K3t3VRKSzzuI3QfgX8eUOmRhVD3dEw/e/dwkmdIHqf0EY33a32CBruWkGwkhX9pjS9BbRO1pEcbxpTWs5CUOZh2PxL5cZpSnc0Dtw1G48BGcgTeM+MnY4A5Vt1HNGz9Dn0tLFH1IYqlbEGwW6dTecH3FbdkW4/8EUN/PmFNvfv3lfAGG2bVZk5F6N5tjL8EhPFQcGmk30Ov+JDstzd+cN6aSn+UR9vcrWLUeYbP5My3Pj3N2q9vJ+M7Y3pWWulOYoSydja8f+TjYXSvkMZWN5dEhZP8p8aq2TxLpRBbXsbD1nG7O4hh7F1LLOjI2h67uJTYPd3XgvNXezqzQi/1LftSlb74VJ9WwKahJtSxtDo9GPAXvRou1vtohV9X6d8C8OAveUUBCWN7AAAAAElFTkSuQmCC');
          opacity: 0.35;
          mix-blend-mode: soft-light;
          animation: retroGrain 22s steps(6, end) infinite;
        }
        .ticker-track {
          display: inline-flex;
          align-items: center;
          gap: 2.5rem;
          padding: 0.75rem 2rem;
          white-space: nowrap;
          min-width: 100%;
          will-change: transform;
          animation: ticker 18s linear infinite;
        }
        .ticker-track span {
          letter-spacing: 0.32em;
          text-transform: uppercase;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .poster-card:hover img,
        .poster-card:focus-visible img {
          filter: contrast(1.1) saturate(1.05);
        }
      `}</style>
    </main>
  );
}

function TierBand({ tier }: { tier: Tier }) {
  return (
    <article className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[#06070d]/60 shadow-[0_32px_90px_rgba(9,12,21,0.45)] backdrop-blur-md">
      <div
        className={`pointer-events-none absolute inset-0 -z-10 opacity-90 blur-lg transition duration-700 ${tier.frame}`}
      />
      <div className={`pointer-events-none absolute inset-0 -z-20 bg-gradient-to-r ${tier.gradient} mix-blend-lighten`} />
      <div className="relative flex flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] ${tier.accent}`}
              >
                {tier.name}
              </span>
              <span className="text-xs uppercase tracking-[0.4em] text-white/60">{tier.label}</span>
            </div>
            <p className="text-sm text-slate-300 sm:max-w-xl">{tier.tagline}</p>
          </div>
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <span className="h-px w-12 bg-white/30" />
            <span className="text-xs uppercase tracking-[0.48em] text-white/50">Tier {tier.id}</span>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tier.artists.map((artist) => (
            <ArtistPolaroid key={artist.name} artist={artist} />
          ))}
        </div>

        <div className={`relative overflow-hidden rounded-full border border-white/10 ${tier.tickerTone}`}>
          <div className="ticker-track">
            {tier.artists.map((artist) => (
              <span key={`${artist.name}-ticker`} className="flex items-center gap-3">
                <span>{artist.name}</span>
                <span aria-hidden="true">//</span>
                <span>{artist.role}</span>
              </span>
            ))}
          </div>
          <div className="ticker-track" style={{ animationDelay: '-9s' }}>
            {tier.artists.map((artist) => (
              <span key={`${artist.name}-ticker-duplicate`} className="flex items-center gap-3">
                <span>{artist.name}</span>
                <span aria-hidden="true">//</span>
                <span>{artist.role}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function ArtistPolaroid({ artist }: { artist: Artist }) {
  return (
    <figure className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_24px_60px_rgba(7,11,19,0.35)] transition duration-500 hover:-translate-y-1">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_60%)] opacity-25 mix-blend-screen" />
      <div className="relative overflow-hidden rounded-[24px]">
        <div className="absolute inset-0 origin-bottom animate-[tapeFloat_12s_ease-in-out_infinite]">
          <div className="absolute inset-x-3 bottom-3 h-20 rounded-[18px] bg-black/25 blur-2xl" />
        </div>
        <img
          src={artist.image}
          alt={artist.name}
          className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <figcaption className="space-y-1 px-5 py-4">
        <div className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">{artist.name}</div>
        {artist.role ? <p className="text-xs uppercase tracking-[0.28em] text-white/50">{artist.role}</p> : null}
      </figcaption>
    </figure>
  );
}

function PosterStack({ tier, index }: { tier: Tier; index: number }) {
  const rotation = index === 0 ? '-rotate-1' : index === 1 ? 'rotate-0' : 'rotate-1';
  const accent =
    index === 0 ? 'from-[#fceacf]/80 via-[#f8d1a5]/70 to-[#a55c6d]/80' : index === 1 ? 'from-[#16243a]/80 via-[#264766]/70 to-[#4195a3]/80' : 'from-[#2f1b27]/80 via-[#51303f]/70 to-[#754d40]/80';

  return (
    <article
      className={`poster-card relative overflow-hidden rounded-[38px] border border-white/12 bg-[#070811]/80 p-7 shadow-[0_26px_80px_rgba(8,11,18,0.6)] backdrop-blur ${rotation}`}
    >
      <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${accent} opacity-80`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent opacity-60 mix-blend-overlay" />
      <header className="space-y-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] ${tier.accent}`}
        >
          {tier.name}
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-white">{tier.label}</h2>
        <p className="text-sm text-slate-200/80">{tier.tagline}</p>
      </header>

      <div className="mt-7 space-y-4">
        {tier.artists.slice(0, 3).map((artist, artistIndex) => (
          <div
            key={`${artist.name}-poster`}
            className="group relative flex items-center gap-4 rounded-3xl border border-white/10 bg-white/8 p-3 pr-4 transition duration-500 hover:translate-x-1"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
              <div className="absolute inset-0 animate-[posterHover_11s_ease-in-out_infinite] opacity-70 blur-xl" />
              <img
                src={artist.image}
                alt={artist.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-[0.26em]">
                {artistIndex + 1}. {artist.name}
              </span>
              {artist.role ? <span className="text-xs uppercase tracking-[0.26em] text-white/50">{artist.role}</span> : null}
            </div>
            <div className="ml-auto text-xs uppercase tracking-[0.4em] text-white/40">
              ***
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-white/50">
        <span className="h-px w-12 bg-white/30" />
        {tier.name} Tier - Queue Ready
      </footer>
    </article>
  );
}
