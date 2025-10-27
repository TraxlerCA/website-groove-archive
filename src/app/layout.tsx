// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { PlayerProvider } from '@/context/PlayerProvider';
import AppShell from '@/components/AppShell';
import { Space_Grotesk } from 'next/font/google';
import { getSheets } from '@/lib/sheets.server';
import type { Genre, Row } from '@/lib/types';
import type { SiteData } from '@/context/SiteDataContext';

const TITLE = 'The Groove Archive';
const DESCRIPTION =
  'Discover hand-curated DJ sets, random serves, and festival heatmaps across SoundCloud and YouTube.';

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s | ${TITLE}`,
  },
  description: DESCRIPTION,
  keywords: [
    'The Groove Archive',
    'DJ sets',
    'SoundCloud mixes',
    'YouTube mixes',
    'festival heatmaps',
    'dance music discovery',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    icon: [{ url: '/icons/icon_list.png', type: 'image/png', sizes: 'any' }],
    shortcut: ['/icons/icon_list.png'],
    apple: [{ url: '/icons/icon_list.png' }],
  },
};

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const sheets = await getSheets();
  const data: SiteData = {
    rows: (sheets.data.list ?? []) as Row[],
    genres: (sheets.data.genres ?? []) as Genre[],
    updatedAt: sheets.updatedAt,
  };

  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} min-h-screen bg-neutral-50 text-neutral-800 font-sans relative overflow-x-hidden`}>
        {/* light theme variables for any legacy components that still reference them */}
        <style>{`:root{--accent:#000000;--label:#737373;--radius:0.75rem;--sodium:#000000}`}</style>
        <PlayerProvider>
          <AppShell data={data}>{children}</AppShell>
        </PlayerProvider>
      </body>
    </html>
  );
}
