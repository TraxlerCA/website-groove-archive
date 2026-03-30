import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

type CacheVal = {
  ts: number;
  payload: { artwork: string } | { artwork: null; miss: { code: 'not_found' | 'no_thumbnail' } };
};
type CacheGlobal = typeof globalThis & { __scArtCache?: Map<string, CacheVal> };

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 256;

function clearRouteCache() {
  (globalThis as CacheGlobal).__scArtCache?.clear();
}

describe('GET /api/soundcloud-artwork', () => {
  beforeEach(() => {
    clearRouteCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearRouteCache();
  });

  it('returns 400 for invalid track urls and skips upstream fetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 500 }));

    const res = await GET(
      new Request(
        'https://example.com/api/soundcloud-artwork?url=https://example.com/not-soundcloud',
      ),
    );
    const json = (await res.json()) as {
      artwork: string | null;
      error?: { code: string; message: string };
    };

    expect(res.status).toBe(400);
    expect(json).toEqual({
      artwork: null,
      error: {
        code: 'invalid_url',
        message: 'A valid SoundCloud track URL is required.',
      },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('caches deterministic not_found misses within TTL', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 404 }));
    const req = new Request(
      'https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/mix',
    );

    const first = await GET(req);
    const second = await GET(req);

    await expect(first.json()).resolves.toEqual({ artwork: null, miss: { code: 'not_found' } });
    await expect(second.json()).resolves.toEqual({ artwork: null, miss: { code: 'not_found' } });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('caches successful upstream artwork results within TTL', async () => {
    const artwork = 'https://i1.sndcdn.com/artworks-1234.jpg';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ thumbnail_url: artwork }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const req = new Request(
      'https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/set',
    );

    const first = await GET(req);
    const second = await GET(req);

    await expect(first.json()).resolves.toEqual({ artwork });
    await expect(second.json()).resolves.toEqual({ artwork });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('caches 200 responses without a thumbnail as no_thumbnail misses', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ title: 'No art here' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const req = new Request(
      'https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/empty',
    );

    const first = await GET(req);
    const second = await GET(req);

    await expect(first.json()).resolves.toEqual({ artwork: null, miss: { code: 'no_thumbnail' } });
    await expect(second.json()).resolves.toEqual({ artwork: null, miss: { code: 'no_thumbnail' } });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('refetches after TTL expiry', async () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 404 }));
    const req = new Request(
      'https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/track',
    );

    await GET(req);

    now += CACHE_TTL_MS - 1;
    await GET(req);

    now += 2;
    await GET(req);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('evicts the oldest cache entry after the max size is exceeded', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const requestUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const artworkId = new URL(requestUrl).searchParams.get('url')?.split('/').pop() ?? 'missing';

      return new Response(JSON.stringify({ thumbnail_url: `https://cdn.test/${artworkId}.jpg` }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    for (let index = 0; index < MAX_CACHE_ENTRIES; index += 1) {
      await GET(
        new Request(
          `https://example.com/api/soundcloud-artwork?url=${encodeURIComponent(`https://soundcloud.com/artist/set-${index}`)}`,
        ),
      );
    }

    await GET(
      new Request(
        `https://example.com/api/soundcloud-artwork?url=${encodeURIComponent('https://soundcloud.com/artist/set-overflow')}`,
      ),
    );
    await GET(
      new Request(
        `https://example.com/api/soundcloud-artwork?url=${encodeURIComponent('https://soundcloud.com/artist/set-0')}`,
      ),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(MAX_CACHE_ENTRIES + 2);
  });

  it('returns 502 for upstream 5xx responses and does not cache them', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 503 }));
    const req = new Request(
      'https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/outage',
    );

    const first = await GET(req);
    const second = await GET(req);

    await expect(first.json()).resolves.toEqual({
      artwork: null,
      error: {
        code: 'upstream_unavailable',
        message: 'SoundCloud artwork is temporarily unavailable.',
      },
    });
    await expect(second.json()).resolves.toEqual({
      artwork: null,
      error: {
        code: 'upstream_unavailable',
        message: 'SoundCloud artwork is temporarily unavailable.',
      },
    });
    expect(first.status).toBe(502);
    expect(second.status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('returns 502 for fetch exceptions and does not cache them', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network down'));
    const req = new Request(
      'https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/network',
    );

    const first = await GET(req);
    const second = await GET(req);

    expect(first.status).toBe(502);
    expect(second.status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
