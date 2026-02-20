// src/app/api/soundcloud-artwork/route.ts
import { NextResponse } from "next/server";

type CacheVal = { ts: number; val: string | null };
type CacheRead = { hit: false } | { hit: true; val: string | null };
const CACHE_TTL_MS = 10 * 60 * 1000;

declare global {
  var __scArtCache: Map<string, CacheVal> | undefined;
}
globalThis.__scArtCache = globalThis.__scArtCache ?? new Map<string, CacheVal>();

function getCached(key: string): CacheRead {
  const hit = globalThis.__scArtCache!.get(key);
  if (!hit) return { hit: false } as const;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    globalThis.__scArtCache!.delete(key);
    return { hit: false } as const;
  }
  return { hit: true, val: hit.val } as const;
}
function setCached(key: string, val: string | null) {
  globalThis.__scArtCache!.set(key, { ts: Date.now(), val });
}


export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const trackUrl = url.searchParams.get("url");
    if (!trackUrl || !/^https?:\/\/(www\.)?soundcloud\.com\//i.test(trackUrl)) {
      return NextResponse.json({ artwork: null }, { status: 400 });
    }

    const key = trackUrl;
    const cached = getCached(key);
    if (cached.hit) {
      return NextResponse.json({ artwork: cached.val }, { headers: { "Cache-Control": "no-store" } });
    }

    const res = await fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) {
      setCached(key, null);
      return NextResponse.json({ artwork: null }, { status: 200 });
    }
    const data = (await res.json()) as { thumbnail_url?: string };
    const artwork = data?.thumbnail_url || null;
    setCached(key, artwork);
    return NextResponse.json({ artwork }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ artwork: null }, { status: 200 });
  }
}
