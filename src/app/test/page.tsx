'use client';

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
  accentBg: string;
  accentText: string;
  frame: string;
  artists: Artist[];
};

const TIERS: Tier[] = [
  {
    id: 'blazing',
    name: 'Blazing',
    label: 'Packed Out Every Time',
    tagline: 'Guaranteed-to-sell headliners with national buzz and polished live shows.',
    gradient: 'from-[#fff1e4]/95 via-[#fde2ce]/85 to-[#f6c5b1]/80',
    accentBg: 'bg-[rgba(251,127,95,0.12)]',
    accentText: 'text-[#8b3a24]',
    frame: 'bg-[linear-gradient(135deg,rgba(255,246,240,0.7),rgba(250,214,195,0.55),rgba(236,160,120,0.35))]',
    artists: [
      {
        name: 'Luna Cascade',
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
        role: 'Synth Soul',
      },
      {
        name: 'Velvet Redux',
        image: 'https://images.unsplash.com/photo-1468367875723-09d5f0bba81c?auto=format&fit=crop&w=400&q=80',
        role: 'Neo Funk',
      },
      {
        name: 'Royal Static',
        image: 'https://images.unsplash.com/photo-1502851721866-69b7be8cb5b0?auto=format&fit=crop&w=400&q=80',
        role: 'Avant Rock',
      },
      {
        name: 'Mona Flux',
        image: 'https://images.unsplash.com/photo-1525187637636-2430cd12f5e4?auto=format&fit=crop&w=400&q=80',
        role: 'Alt Pop',
      },
      {
        name: 'Fever Debt',
        image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=400&q=80',
        role: 'Indie Pop',
      },
      {
        name: 'Golden Hour',
        image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=400&q=80',
        role: 'Electro R&B',
      },
    ],
  },
  {
    id: 'hot',
    name: 'Hot',
    label: 'Crowd Energizers',
    tagline: 'Tour-ready artists with strong word of mouth and fast-growing followings.',
    gradient: 'from-[#eef5ff]/95 via-[#dce9ff]/85 to-[#c1dafd]/80',
    accentBg: 'bg-[rgba(59,130,246,0.12)]',
    accentText: 'text-[#1f3c88]',
    frame: 'bg-[linear-gradient(140deg,rgba(232,241,255,0.7),rgba(187,219,255,0.5),rgba(123,156,226,0.35))]',
    artists: [
      {
        name: 'Echo Motel',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
        role: 'Alt Disco',
      },
      {
        name: 'Polychrome',
        image: 'https://images.unsplash.com/photo-1517840545241-b491010a7a92?auto=format&fit=crop&w=400&q=80',
        role: 'Indie Wave',
      },
      {
        name: 'Gilded Youth',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        role: 'Dream Pop',
      },
      {
        name: 'Night Parcel',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80',
        role: 'Electro Indie',
      },
      {
        name: 'Paper Lanterns',
        image: 'https://images.unsplash.com/photo-1542204637-e67bc7d41e48?auto=format&fit=crop&w=400&q=80',
        role: 'Lo-Fi House',
      },
      {
        name: 'Static Rivers',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        role: 'Indie R&B',
      },
    ],
  },
  {
    id: 'ok',
    name: 'Ok',
    label: 'Emerging Selects',
    tagline: 'Fresh faces delivering consistent sets and building loyal pockets of fans.',
    gradient: 'from-[#f4f5f7]/95 via-[#eceef2]/85 to-[#e2e5ea]/80',
    accentBg: 'bg-[rgba(154,166,177,0.14)]',
    accentText: 'text-[#3c4755]',
    frame: 'bg-[linear-gradient(150deg,rgba(236,240,244,0.7),rgba(210,216,224,0.55),rgba(174,181,192,0.35))]',
    artists: [
      {
        name: 'Static Bloom',
        image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80',
        role: 'Lo-Fi R&B',
      },
      {
        name: 'Cassette Hive',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        role: 'Bedroom Pop',
      },
      {
        name: 'Soft Panic',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        role: 'Downtempo',
      },
      {
        name: 'Night Census',
        image: 'https://images.unsplash.com/photo-1517840545241-b491010a7a92?auto=format&fit=crop&w=400&q=80',
        role: 'Indie Folk',
      },
      {
        name: 'Violet Letters',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        role: 'Ambient Pop',
      },
      {
        name: 'Glass Atlas',
        image: 'https://images.unsplash.com/photo-1542204637-e67bc7d41e48?auto=format&fit=crop&w=400&q=80',
        role: 'Alt Electronic',
      },
    ],
  },
];

// continuous marquee; no timed pagination needed

export default function TestPage() {
  return (
    <main className="relative overflow-hidden bg-dark-cinema px-5 py-14 text-slate-100 sm:px-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="grain-overlay" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        <header className="space-y-4 text-center sm:text-left">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-300 shadow-sm">
            Tier Showcase
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-[2.75rem]">
            Retro Tier Tape - Artists in Varying Glow
          </h1>
          <p className="text-base text-slate-300 sm:max-w-2xl sm:text-lg">
            Refined parallax tape stacks to surface Blazing, Hot, and Ok tiers. Rotating artist cards keep the energy
            moving without overcrowding the layout.
          </p>
        </header>

        <section className="space-y-10">
          {TIERS.map((tier) => (
            <TierBand key={tier.id} tier={tier} />
          ))}
        </section>
      </div>

      <style>{`
        @keyframes grainPulse {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.05); }
          40% { transform: translate3d(-1.5%, -1%, 0) scale(1.06); }
          70% { transform: translate3d(1.2%, 1%, 0) scale(1.04); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px) rotate(-0.4deg); }
          50% { transform: translateY(-6px) rotate(0.4deg); }
        }
        .grain-overlay {
          position: absolute;
          inset: -200%;
          background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRDcmVhdGlvbiBUaW1lAAfLAAABWElEQVR4nO2XwW3DMAxFX20A7KAHKADugAdoAO6AB2gA7oAHKADyQ09uZSWnQ7rLaakCSZM5Ht55d4Vp0U80JwD34dAEzjkgh1H23AArxDWPRBkMtsjit97oRGmVX6cpKoAkh5hXnuOJZoJ8x4K3t3VRKSzzuI3QfgX8eUOmRhVD3dEw/e/dwkmdIHqf0EY33a32CBruWkGwkhX9pjS9BbRO1pEcbxpTWs5CUOZh2PxL5cZpSnc0Dtw1G48BGcgTeM+MnY4A5Vt1HNGz9Dn0tLFH1IYqlbEGwW6dTecH3FbdkW4/8EUN/PmFNvfv3lfAGG2bVZk5F6N5tjL8EhPFQcGmk30Ov+JDstzd+cN6aSn+UR9vcrWLUeYbP5My3Pj3N2q9vJ+M7Y3pWWulOYoSydja8f+TjYXSvkMZWN5dEhZP8p8aq2TxLpRBbXsbD1nG7O4hh7F1LLOjI2h67uJTYPd3XgvNXezqzQi/1LftSlb74VJ9WwKahJtSxtDo9GPAXvRou1vtohV9X6d8C8OAveUUBCWN7AAAAAElFTkSuQmCC');
          mix-blend-mode: soft-light;
          animation: grainPulse 22s steps(6, end) infinite;
        }
      `}</style>
    </main>
  );
}

function TierBand({ tier }: { tier: Tier }) {
  const [entered, setEntered] = React.useState(false);
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
          setEntered(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article
      ref={ref}
      className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur transition duration-700 ease-out ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 -z-10 ${tier.frame} opacity-20`} />
      <div className={`pointer-events-none absolute inset-0 -z-20 bg-gradient-to-r ${tier.gradient} opacity-10`} />

      <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] ${tier.accentBg} text-white/80`}
              >
                {tier.name}
              </span>
              <span className="text-xs uppercase tracking-[0.36em] text-slate-400">{tier.label}</span>
            </div>
            <p className="text-sm text-slate-300 sm:max-w-xl">{tier.tagline}</p>
          </div>
          <span className="text-xs uppercase tracking-[0.38em] text-slate-500">Tier {tier.id}</span>
        </header>

        <TierCarousel items={tier.artists} speed={tier.id === 'blazing' ? 26 : tier.id === 'hot' ? 22 : 18} />
      </div>
    </article>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <figure className="group relative w-[var(--card-size)] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_18px_36px_rgba(0,0,0,0.45)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)] opacity-70" />
      <div className="relative h-[var(--card-size)] w-[var(--card-size)] overflow-hidden rounded-xl">
        <div className="absolute inset-0 origin-bottom animate-[cardFloat_11s_ease-in-out_infinite]" />
        <img
          src={artist.image}
          alt={artist.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 128px"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 drop-shadow">
            {artist.name}
          </div>
        </div>
      </div>
    </figure>
  );
}

type CarouselProps = { items: Artist[]; speed?: number };

function TierCarousel({ items, speed = 22 }: CarouselProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = React.useState<number>(40);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Read CSS var --card-size to set the marquee duration proportional to width
    const root = getComputedStyle(document.documentElement);
    const sizeStr = root.getPropertyValue('--card-size').trim().replace('px', '');
    const size = Number(sizeStr) || 128;
    const gap = 16; // approximate gap between cards
    const estimated = (size + gap) * items.length;
    // duration proportional to width and desired speed
    const d = Math.max(10, Math.round(estimated / (speed * 10)));
    setDuration(d);
  }, [items.length, speed]);

  return (
    <div
      className="relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Artist marquee"
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
        <div className="vignette" />
      </div>
      <div
        ref={containerRef}
        className="group/track relative -mx-2 flex gap-4 px-2"
      >
        {/* duplicate tracks for seamless loop */}
        <Track items={items} duration={duration} />
        <Track items={items} duration={duration} ariaHidden />
      </div>
    </div>
  );
}

function Track({ items, duration, ariaHidden }: { items: Artist[]; duration: number; ariaHidden?: boolean }) {
  return (
    <div
      className="marquee-running flex shrink-0 gap-4 pr-4"
      style={{ animationDuration: `${duration}s` }}
      aria-hidden={ariaHidden}
    >
      {items.map((artist) => (
        <div key={(ariaHidden ? 'b-' : 'a-') + artist.name} className="w-[var(--card-size)] max-w-[70vw]">
          <ArtistCard artist={artist} />
        </div>
      ))}
    </div>
  );
}

/* removed: old pagination controls and responsive count logic in favor of continuous marquee */
