// src/app/api/soundcloud-artwork/route.ts
import { NextResponse } from 'next/server';

type ArtworkMissCode = 'not_found' | 'no_thumbnail';
type ArtworkSuccessPayload = { artwork: string };
type ArtworkMissPayload = { artwork: null; miss: { code: ArtworkMissCode } };
type CachedArtworkPayload = ArtworkSuccessPayload | ArtworkMissPayload;
type CacheVal = { ts: number; payload: CachedArtworkPayload };
type CacheRead = { hit: false } | { hit: true; payload: CachedArtworkPayload };
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 256;

declare global {
  var __scArtCache: Map<string, CacheVal> | undefined;
}
globalThis.__scArtCache = globalThis.__scArtCache ?? new Map<string, CacheVal>();

function getCached(key: string): CacheRead {
  const cache = globalThis.__scArtCache!;
  const hit = cache.get(key);
  if (!hit) return { hit: false } as const;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return { hit: false } as const;
  }
  cache.delete(key);
  cache.set(key, hit);
  return { hit: true, payload: hit.payload } as const;
}

function setCached(key: string, payload: CachedArtworkPayload) {
  const cache = globalThis.__scArtCache!;
  cache.delete(key);
  cache.set(key, { ts: Date.now(), payload });

  if (cache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const oldestKey = cache.keys().next().value;
  if (oldestKey) {
    cache.delete(oldestKey);
  }
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}


export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const trackUrl = url.searchParams.get('url');
    if (!trackUrl || !/^https?:\/\/(www\.)?soundcloud\.com\//i.test(trackUrl)) {
      return json(
        {
          artwork: null,
          error: {
            code: 'invalid_url',
            message: 'A valid SoundCloud track URL is required.',
          },
        },
        400,
      );
    }

    const key = trackUrl;
    const cached = getCached(key);
    if (cached.hit) {
      return json(cached.payload);
    }

    const res = await fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`,
      { headers: { accept: 'application/json' } },
    );

    if (res.status >= 500) {
      console.warn(`SoundCloud artwork upstream unavailable: ${res.status} for ${trackUrl}`);
      return json(
        {
          artwork: null,
          error: {
            code: 'upstream_unavailable',
            message: 'SoundCloud artwork is temporarily unavailable.',
          },
        },
        502,
      );
    }

    if (res.status >= 400) {
      const payload: ArtworkMissPayload = { artwork: null, miss: { code: 'not_found' } };
      setCached(key, payload);
      return json(payload);
    }

    const data = (await res.json()) as { thumbnail_url?: string };
    if (!data.thumbnail_url) {
      const payload: ArtworkMissPayload = { artwork: null, miss: { code: 'no_thumbnail' } };
      setCached(key, payload);
      return json(payload);
    }

    const payload: ArtworkSuccessPayload = { artwork: data.thumbnail_url };
    setCached(key, payload);
    return json(payload);
  } catch (error: unknown) {
    console.warn(
      `SoundCloud artwork upstream unavailable: ${error instanceof Error ? error.message : 'request failed'}`,
    );
    return json(
      {
        artwork: null,
        error: {
          code: 'upstream_unavailable',
          message: 'SoundCloud artwork is temporarily unavailable.',
        },
      },
      502,
    );
  }
}
