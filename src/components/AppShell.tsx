// src/components/AppShell.tsx
'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Fonts, WordmarkHeader } from '@/components/Header';
import CommandBar from '@/components/CommandBar';
import NowPlayingBar from '@/components/NowPlayingBar';
import PlayerModal from '@/components/PlayerModal';
import ScrollTopFab from '@/components/ScrollTopFab';
import { useRows } from '@/lib/useRows';

type Route = 'home'|'list'|'serve'|'heatmaps'|'suggest';

export default function AppShell({ children }: { children: ReactNode }) {
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
