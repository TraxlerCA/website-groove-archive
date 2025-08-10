// src/app/page.tsx
'use client';

export default function Home() {
  return (
    <main className="container mx-auto max-w-6xl px-6 pt-10">
      <section className="mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          <a href="/suggest" className="group rounded-2xl border border-neutral-200 bg-gradient-to-b from-blue-600 to-blue-700 p-8 text-center text-white hover:shadow-lg hover:-translate-y-0.5 transition">
            <div className="text-lg font-medium tracking-wide" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Suggest a set</div>
            <p className="mt-2 text-sm text-white/85">Get 3 picks based on your filters</p>
          </a>
          <a href="/list" className="group rounded-2xl border border-neutral-200 bg-white p-8 text-center hover:shadow-lg hover:-translate-y-0.5 transition">
            <div className="text-lg font-medium tracking-wide" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Show the list</div>
            <p className="mt-2 text-sm text-neutral-500">Browse all sets with filters</p>
          </a>
          <a href="/heatmaps" className="group rounded-2xl border border-neutral-200 bg-white p-8 text-center hover:shadow-lg hover:-translate-y-0.5 transition">
            <div className="text-lg font-medium tracking-wide" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>Map the heat</div>
            <p className="mt-2 text-sm text-neutral-500">See ratings and energy by genre</p>
          </a>
        </div>
      </section>
    </main>
  );
}
