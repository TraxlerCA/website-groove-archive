// src/components/AppShell.tsx
'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { WordmarkHeader, ResourceHints } from '@/components/Header';
import CommandBar from '@/components/CommandBar';
import CompactPillPlayer from '@/components/player/CompactPillPlayer';
import PlayerModal from '@/components/PlayerModal';
import ScrollTopFab from '@/components/ScrollTopFab';
import { SiteDataProvider, type SiteData } from '@/context/SiteDataContext';

type Route = 'home' | 'list' | 'serve' | 'heatmaps' | 'suggest';

export default function AppShell({ children, data }: { children: ReactNode; data: SiteData }) {
  const router = useRouter();

  const onNavigate = (r: Route) => router.push(r === 'home' ? '/' : `/${r}`);

  return (
    <SiteDataProvider value={data}>
      <ResourceHints />
      <WordmarkHeader />
      {children}
      <CommandBar rows={data.rows} onNavigate={onNavigate} />
      <ScrollTopFab />
      <CompactPillPlayer />
      <PlayerModal />
    </SiteDataProvider>
  );
}
