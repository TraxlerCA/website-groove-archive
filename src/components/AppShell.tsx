// src/components/AppShell.tsx
'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Fonts, WordmarkHeader } from '@/components/Header';
import CommandBar from '@/components/CommandBar';
import NowPlayingBar from '@/components/NowPlayingBar';
import PlayerModal from '@/components/PlayerModal';
import ScrollTopFab from '@/components/ScrollTopFab';
import { useRows } from '@/lib/useRows';

type Route = 'home'|'list'|'suggest'|'heatmaps';
const routeFromPath = (p: string): Route => p.startsWith('/list') ? 'list' : p.startsWith('/suggest') ? 'suggest' : p.startsWith('/heatmaps') ? 'heatmaps' : 'home';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const route = useMemo(() => routeFromPath(pathname), [pathname]);
  const router = useRouter();
  const { rows } = useRows();

  const onNavigate = (r: Route) => router.push(r === 'home' ? '/' : `/${r}`);

  return (
    <>
      <Fonts />
      <WordmarkHeader />
      {children}
      <CommandBar rows={rows} onNavigate={onNavigate} />
      <ScrollTopFab />
      <NowPlayingBar />
      <PlayerModal />
    </>
  );
}
