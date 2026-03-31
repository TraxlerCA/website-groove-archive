'use client';

import { useEffect, useMemo, useState } from 'react';

type ArtworkState =
  | { status: 'idle'; artwork: null }
  | { status: 'loading'; artwork: null }
  | { status: 'ready'; artwork: string }
  | { status: 'missing'; artwork: null };

type ArtworkCacheEntry = ArtworkState & {
  promise?: Promise<void>;
};

const artworkCache = new Map<string, ArtworkCacheEntry>();
const warmedImages = new Set<string>();

function supportsArtworkLookup(soundcloudUrl: string) {
  try {
    const host = new URL(soundcloudUrl).hostname.toLowerCase();
    return host === 'soundcloud.com' || host === 'www.soundcloud.com';
  } catch {
    return false;
  }
}

function warmBrowserImage(url: string) {
  if (typeof window === 'undefined' || warmedImages.has(url)) return;

  warmedImages.add(url);
  const image = new window.Image();
  image.decoding = 'async';
  image.src = url;
}

async function fetchArtwork(soundcloudUrl: string) {
  const response = await fetch(
    `/api/soundcloud-artwork?url=${encodeURIComponent(soundcloudUrl)}`,
    { cache: 'force-cache' },
  );

  if (!response.ok) {
    throw new Error(`Artwork fetch failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { artwork: string | null };
  return payload.artwork;
}

function primeArtwork(soundcloudUrl: string): Promise<void> {
  if (!supportsArtworkLookup(soundcloudUrl)) {
    artworkCache.set(soundcloudUrl, { status: 'missing', artwork: null });
    return Promise.resolve();
  }

  const cached = artworkCache.get(soundcloudUrl);
  if (cached?.status === 'ready' || cached?.status === 'missing') {
    return Promise.resolve();
  }
  if (cached?.promise) {
    return cached.promise;
  }

  const promise = fetchArtwork(soundcloudUrl)
    .then((artwork) => {
      if (artwork) {
        artworkCache.set(soundcloudUrl, { status: 'ready', artwork });
        warmBrowserImage(artwork);
        return;
      }

      artworkCache.set(soundcloudUrl, { status: 'missing', artwork: null });
    })
    .catch(() => {
      artworkCache.set(soundcloudUrl, { status: 'missing', artwork: null });
    });

  artworkCache.set(soundcloudUrl, {
    status: 'loading',
    artwork: null,
    promise,
  });

  return promise;
}

function readArtwork(soundcloudUrl: string | null | undefined): ArtworkState {
  if (!soundcloudUrl) return { status: 'missing', artwork: null };
  return artworkCache.get(soundcloudUrl) ?? { status: 'idle', artwork: null };
}

export function useRecordBinArtwork(options: {
  activeUrl: string | null;
  visibleUrls: string[];
  preloadUrls: string[];
}) {
  const { activeUrl, visibleUrls, preloadUrls } = options;
  const [, setVersion] = useState(0);

  const visibleKey = useMemo(() => visibleUrls.join('|'), [visibleUrls]);
  const preloadKey = useMemo(() => preloadUrls.join('|'), [preloadUrls]);

  useEffect(() => {
    let cancelled = false;

    const notify = () => {
      if (!cancelled) {
        setVersion((current) => current + 1);
      }
    };

    const visibleWithoutActive = visibleUrls.filter((url) => url !== activeUrl);

    if (activeUrl) {
      void primeArtwork(activeUrl).finally(notify);
    }

    visibleWithoutActive.forEach((url) => {
      void primeArtwork(url).finally(notify);
    });

    const preloadTimer = window.setTimeout(() => {
      preloadUrls.forEach((url) => {
        void primeArtwork(url).finally(notify);
      });
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(preloadTimer);
    };
  }, [activeUrl, visibleKey, preloadKey, visibleUrls, preloadUrls]);

  return {
    readArtwork,
  };
}
