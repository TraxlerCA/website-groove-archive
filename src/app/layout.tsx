// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';

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

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-urbanist',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className={`${urbanist.className} min-h-screen bg-neutral-50 text-neutral-800 relative overflow-x-hidden`}>
        <style>{`:root{--accent:#000000;--label:#737373;--radius:0.75rem;--sodium:#000000}`}</style>
        {children}
      </body>
    </html>
  );
}
