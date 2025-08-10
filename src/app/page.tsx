// src/app/page.tsx
'use client';
import { CTA } from '@/components/ui';

export default function Home() {
  return (
    <main className="relative z-20 min-h-screen grid place-items-center px-6 pt-20">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-10 leading-tight" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          festival-grade <span className="text-[var(--sodium)] drop-shadow-[0_0_12px_rgba(183,255,46,0.35)]">DJ sets</span>, curated
        </h1>
        <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-center justify-center">
          <a href="/list"><CTA label="the list" variant="primary" big /></a>
          <a href="/suggest"><CTA label="suggest me a set" variant="signal" big /></a>
        </div>
        <div className="mt-6 md:mt-8 flex items-center justify-center">
          <a href="/heatmaps"><CTA label="heatmaps" variant="ghost" /></a>
        </div>
      </div>
    </main>
  );
}
