// src/components/AppShell.tsx
'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Fonts, IndustrialGlowTheme, AnimatedBackdrop, SiteHeader } from '@/components/Header';
import CommandBar from '@/components/CommandBar';
import NowPlayingBar from '@/components/NowPlayingBar';
import PlayerModal from '@/components/PlayerModal';
import ScrollTopFab from '@/components/ScrollTopFab';
import { useRows } from '@/lib/useRows';

type Route = 'home'|'list'|'suggest'|'heatmaps';

function routeFromPath(path: string): Route {
  if (path.startsWith('/list')) return 'list';
  if (path.startsWith('/suggest')) return 'suggest';
  if (path.startsWith('/heatmaps')) return 'heatmaps';
  return 'home';
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const route = useMemo(() => routeFromPath(pathname), [pathname]);
  const router = useRouter();
  const { rows } = useRows(); // shared dataset for CommandBar

  const onNavigate = (r: Route) => {
    router.push(r === 'home' ? '/' : `/${r}`);
  };

  return (
    <>
      <Fonts />
      <IndustrialGlowTheme />
      <AnimatedBackdrop />
      <SiteHeader route={route} onSetRoute={onNavigate} />
      {children}
      <CommandBar rows={rows} onNavigate={onNavigate} />
      <ScrollTopFab />
      <NowPlayingBar />
      <PlayerModal />
    </>
  );
}
