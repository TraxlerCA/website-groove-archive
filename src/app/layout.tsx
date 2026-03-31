// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

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

const urbanist = localFont({
  src: [
    {
      path: './fonts/Urbanist-latin-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-urbanist',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className={`${urbanist.className} relative min-h-screen overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
