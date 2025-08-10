// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import { PlayerProvider } from '@/context/PlayerProvider';
import AppShell from '@/components/AppShell';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--coal)] text-[var(--fog)] font-sans relative overflow-x-hidden">
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
      </body>
    </html>
  );
}
