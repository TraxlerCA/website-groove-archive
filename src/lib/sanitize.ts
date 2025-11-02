const ALLOWED_HOSTS = new Set([
  // SoundCloud
  'soundcloud.com',
  'www.soundcloud.com',
  'm.soundcloud.com',
  'on.soundcloud.com',
  // YouTube
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const YOUTUBE_PATH_REQUIRED_HOSTS = new Set(['youtu.be']);

/**
 * Return a safe https URL for SoundCloud/YouTube links, or null when invalid.
 * Strips credentials, rejects non-https, unknown hosts, or custom ports.
 */
export function sanitizeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) {
    parsed.username = '';
    parsed.password = '';
  }
  if (parsed.port) return null;

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;

  if (YOUTUBE_PATH_REQUIRED_HOSTS.has(host)) {
    const id = parsed.pathname.replace(/^\/+/g, '');
    if (!id) return null;
  }

  return parsed.toString();
}

