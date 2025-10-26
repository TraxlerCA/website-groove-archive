// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { PlayerProvider } from '@/context/PlayerProvider';
import AppShell from '@/components/AppShell';

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-800 font-sans relative overflow-x-hidden">
        {/* light theme variables for any legacy components that still reference them */}
        <style>{`:root{--accent:#000000;--label:#737373;--radius:0.75rem;--sodium:#000000}`}</style>
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
      </body>
    </html>
  );
}
