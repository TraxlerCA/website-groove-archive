import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ArtistsPageClient, { getArtistListHref } from './ArtistsPageClient';

describe('ArtistsPageClient', () => {
  it('builds list links with encoded artist names', () => {
    expect(getArtistListHref('Above & Beyond')).toBe('/list?q=Above%20%26%20Beyond');
    expect(getArtistListHref("Folamour's Groove")).toBe("/list?q=Folamour's%20Groove");
  });

  it('renders artist links for each rating group', () => {
    const html = renderToStaticMarkup(
      createElement(ArtistsPageClient, {
        artistsByRating: {
          blazing: [{ name: 'Above & Beyond', rating: 'blazing' }],
          hot: [{ name: 'Octo Octa', rating: 'hot' }],
          ok: [{ name: "Folamour's Groove", rating: 'ok' }],
        },
      }),
    );

    expect(html).toContain('href="/list?q=Above%20%26%20Beyond"');
    expect(html).toContain('href="/list?q=Octo%20Octa"');
    expect(html).toContain('href="/list?q=Folamour&#x27;s%20Groove"');
  });
});
