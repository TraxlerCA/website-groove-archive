import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

type CacheVal = { ts: number; val: string | null };
type CacheGlobal = typeof globalThis & { __scArtCache?: Map<string, CacheVal> };
const CACHE_TTL_MS = 10 * 60 * 1000;

function clearRouteCache() {
  (globalThis as CacheGlobal).__scArtCache?.clear();
}

describe("GET /api/soundcloud-artwork", () => {
  beforeEach(() => {
    clearRouteCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearRouteCache();
  });

  it("returns 400 for invalid track urls and skips upstream fetch", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 500 }));

    const res = await GET(
      new Request(
        "https://example.com/api/soundcloud-artwork?url=https://example.com/not-soundcloud",
      ),
    );
    const json = (await res.json()) as { artwork: string | null };

    expect(res.status).toBe(400);
    expect(json).toEqual({ artwork: null });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("caches negative (null) upstream results within TTL", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 404 }));
    const req = new Request(
      "https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/mix",
    );

    const first = await GET(req);
    const firstJson = (await first.json()) as { artwork: string | null };
    const second = await GET(req);
    const secondJson = (await second.json()) as { artwork: string | null };

    expect(first.status).toBe(200);
    expect(firstJson).toEqual({ artwork: null });
    expect(second.status).toBe(200);
    expect(secondJson).toEqual({ artwork: null });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("caches successful upstream artwork results within TTL", async () => {
    const artwork = "https://i1.sndcdn.com/artworks-1234.jpg";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ thumbnail_url: artwork }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const req = new Request(
      "https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/set",
    );

    const first = await GET(req);
    const firstJson = (await first.json()) as { artwork: string | null };
    const second = await GET(req);
    const secondJson = (await second.json()) as { artwork: string | null };

    expect(firstJson).toEqual({ artwork });
    expect(secondJson).toEqual({ artwork });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("refetches after TTL expiry", async () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 404 }));
    const req = new Request(
      "https://example.com/api/soundcloud-artwork?url=https://soundcloud.com/artist/track",
    );

    await GET(req); // fetch #1

    now += CACHE_TTL_MS - 1;
    await GET(req); // cached hit

    now += 2;
    await GET(req); // fetch #2 after TTL

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
