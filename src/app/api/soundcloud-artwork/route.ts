// src/app/api/soundcloud-artwork/route.ts
import { NextResponse } from "next/server";

type CacheVal = { ts: number; val: string | null };
const TTL = 10 * 60 * 1000;
const g = globalThis as any;
g.__scArtCache ||= new Map<string, CacheVal>();

function getCached(key: string) {
  const hit = g.__scArtCache.get(key) as CacheVal | undefined;
  if (!hit) return null;
  if (Date.now() - hit.ts > TTL) return null;
  return hit.val;
}
function setCached(key: string, val: string | null) {
  g.__scArtCache.set(key, { ts: Date.now(), val });
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
    if (cached !== null) {
      return NextResponse.json({ artwork: cached }, { headers: { "Cache-Control": "no-store" } });
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
  } catch (e: any) {
    return NextResponse.json({ artwork: null }, { status: 200 });
  }
}
