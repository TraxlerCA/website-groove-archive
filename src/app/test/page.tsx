import {
  Barlow_Condensed,
  DM_Mono,
  Exo_2,
  IBM_Plex_Sans,
  Manrope,
  Space_Grotesk,
  Sora,
  Syne,
  Tomorrow,
  Urbanist,
} from 'next/font/google';

const heroCopy = {
  kicker: 'Sets collected since 2019',
  heading: 'Found. Saved. Shared. Played on repeat.',
  body: `This is where the best sets come to live. The ones you stumble upon at 3am and can't stop thinking about. The mixes that soundtracked your best nights and your quietest mornings.`,
};

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });
const sora = Sora({ subsets: ['latin'] });
const urbanist = Urbanist({ subsets: ['latin'] });
const ibmPlex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400'] });
const tomorrow = Tomorrow({ subsets: ['latin'], weight: ['600'] });
const exo2 = Exo_2({ subsets: ['latin'] });
const syne = Syne({ subsets: ['latin'] });
const barlowCondensed = Barlow_Condensed({ subsets: ['latin'], weight: '500' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: '400' });

const typefaces = [
  { label: 'Space Grotesk', vibe: 'futuristic minimalism', font: spaceGrotesk },
  { label: 'Manrope', vibe: 'sleek, low-contrast groove', font: manrope },
  { label: 'Sora', vibe: 'digital luxe with soft edges', font: sora },
  { label: 'Urbanist', vibe: 'airy warehouse signage', font: urbanist },
  { label: 'IBM Plex Sans', vibe: 'industrial and modular', font: ibmPlex },
  { label: 'Tomorrow', vibe: 'laser-lit festival energy', font: tomorrow },
  { label: 'Exo 2', vibe: 'angular, neon-ready geometry', font: exo2 },
  { label: 'Syne', vibe: 'art-forward basement club', font: syne },
  { label: 'Barlow Condensed', vibe: 'poster-worthy condensed titles', font: barlowCondensed },
  { label: 'DM Mono', vibe: 'lo-fi control room monitor', font: dmMono },
];

export default function TypefaceTest() {
  return (
    <main className="container mx-auto max-w-5xl px-6 py-14">
      <h1 className="text-sm font-medium uppercase tracking-[0.32em] text-neutral-400">
        Typeface explorations
      </h1>

      <div className="mt-10 space-y-10">
        {typefaces.map(({ label, vibe, font }) => (
          <section
            key={label}
            className="rounded-3xl border border-neutral-200/60 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition hover:shadow-[0_32px_80px_rgba(15,23,42,0.12)]"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className={`space-y-5 text-neutral-900 ${font.className}`}>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-neutral-400">
                  {heroCopy.kicker}
                  <span className="h-px w-12 bg-neutral-200" />
                </p>
                <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">{heroCopy.heading}</h2>
                <p className="max-w-xl text-base text-neutral-600 sm:text-lg">{heroCopy.body}</p>
              </div>

              <aside className="w-full max-w-[220px] shrink-0 text-sm text-neutral-500">
                <p className="font-semibold text-neutral-800">{label}</p>
                <p>{vibe}</p>
              </aside>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
