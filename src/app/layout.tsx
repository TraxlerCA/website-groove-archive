// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import { PlayerProvider } from '@/context/PlayerProvider';
import AppShell from '@/components/AppShell';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-800 font-sans relative overflow-x-hidden">
        {/* light theme variables for any legacy components that still reference them */}
        <style>{`:root{--accent:#2563eb;--label:#737373;--radius:0.75rem;--sodium:#2563eb}`}</style>
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
      </body>
    </html>
  );
}
