'use client';

import AmsterdamMapHome from '@/components/home/AmsterdamMapHome';
import CrateDiggerHome from '@/components/home/CrateDiggerHome';

type HomeMode = 'map' | 'crate';

function resolveHomeMode(): HomeMode {
  const mode = process.env.NEXT_PUBLIC_HOME_EXPERIENCE;
  if (mode === 'crate') return 'crate';
  return 'map';
}

export default function HomePage() {
  const mode = resolveHomeMode();
  return mode === 'crate' ? <CrateDiggerHome /> : <AmsterdamMapHome />;
}

