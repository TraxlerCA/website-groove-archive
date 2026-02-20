import { describe, expect, it } from "vitest";
import {
  sanitizeMediaUrl,
  sanitizePrimaryMediaUrl,
  sanitizeProviderMediaUrl,
} from "@/lib/sanitize";

describe("sanitizeMediaUrl", () => {
  it("allows known https media domains", () => {
    expect(sanitizeMediaUrl("https://soundcloud.com/artist/set")).toBe(
      "https://soundcloud.com/artist/set",
    );
    expect(sanitizeMediaUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/watch?v=abc123",
    );
  });

  it("rejects invalid protocol, host, and custom port", () => {
    expect(sanitizeMediaUrl("http://soundcloud.com/artist/set")).toBeNull();
    expect(sanitizeMediaUrl("https://example.com/watch?v=abc123")).toBeNull();
    expect(sanitizeMediaUrl("https://soundcloud.com:444/artist/set")).toBeNull();
  });

  it("requires a path segment for youtu.be URLs", () => {
    expect(sanitizeMediaUrl("https://youtu.be/")).toBeNull();
    expect(sanitizeMediaUrl("https://youtu.be/abc123")).toBe(
      "https://youtu.be/abc123",
    );
  });

  it("strips credentials from otherwise valid URLs", () => {
    expect(
      sanitizeMediaUrl("https://user:pass@www.youtube.com/watch?v=abc123"),
    ).toBe("https://www.youtube.com/watch?v=abc123");
  });
});

describe("media URL helpers", () => {
  it("prefers sanitized YouTube URL over SoundCloud", () => {
    expect(
      sanitizePrimaryMediaUrl({
        youtube: "https://www.youtube.com/watch?v=abc123",
        soundcloud: "https://soundcloud.com/artist/set",
      }),
    ).toBe("https://www.youtube.com/watch?v=abc123");
  });

  it("falls back to SoundCloud when YouTube is invalid", () => {
    expect(
      sanitizePrimaryMediaUrl({
        youtube: "javascript:alert(1)",
        soundcloud: "https://soundcloud.com/artist/set",
      }),
    ).toBe("https://soundcloud.com/artist/set");
  });

  it("returns null when no valid outbound link exists", () => {
    expect(
      sanitizePrimaryMediaUrl({
        youtube: "javascript:alert(1)",
        soundcloud: "ftp://soundcloud.com/artist/set",
      }),
    ).toBeNull();
  });

  it("sanitizes provider-specific links without cross-provider fallback", () => {
    const row = {
      youtube: "javascript:alert(1)",
      soundcloud: "https://soundcloud.com/artist/set",
    };
    expect(sanitizeProviderMediaUrl(row, "youtube")).toBeNull();
    expect(sanitizeProviderMediaUrl(row, "soundcloud")).toBe(
      "https://soundcloud.com/artist/set",
    );
  });
});
