import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Genre, Row } from '@/lib/types';

let mockQuery = '';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'q' ? mockQuery : null),
  }),
}));

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => 0,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 56,
      })),
    measureElement: () => undefined,
  }),
}));

vi.mock('@/components/ui', () => ({
  IconButton: ({ children }: { children: ReactNode }) => createElement('button', null, children),
}));

vi.mock('@/components/icons', () => ({
  YouTubeIcon: () => createElement('span', null, 'YT'),
  SCIcon: () => createElement('span', null, 'SC'),
  SearchIcon: () => createElement('span', null, 'Search'),
}));

vi.mock('@/context/PlayerProvider', () => ({
  usePlayerActions: () => ({
    play: () => undefined,
  }),
}));

vi.mock('@/components/GenreTooltip', () => ({
  GenreTooltip: ({ label }: { label: string }) => createElement('span', null, label),
}));

const { default: ListPageClient } = await import('./ListPageClient');

describe('ListPageClient', () => {
  beforeEach(() => {
    mockQuery = '';
  });

  it('prefills the search input from the q search param and filters matching rows', () => {
    mockQuery = 'adriatique';

    const rows: Row[] = [
      {
        set: 'Adriatique at Hatshepsut temple',
        classification: 'Melodic House & Techno',
        tier: 'hot',
        soundcloud: null,
        youtube: null,
      },
      {
        set: 'Octo Octa at Dekmantel',
        classification: 'Breaks',
        tier: 'ok',
        soundcloud: null,
        youtube: null,
      },
    ];
    const genres: Genre[] = [];

    const html = renderToStaticMarkup(createElement(ListPageClient, { rows, genres }));

    expect(html).toContain('value="adriatique"');
    expect(html).toContain('Adriatique at Hatshepsut temple');
    expect(html).not.toContain('Octo Octa at Dekmantel');
  });
});
