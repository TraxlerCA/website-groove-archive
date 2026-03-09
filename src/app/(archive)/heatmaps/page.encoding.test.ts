import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("heatmaps page text encoding", () => {
  it("does not contain known mojibake sequences", () => {
    const pageSource = readFileSync(
      resolve(process.cwd(), "src/app/(archive)/heatmaps/page.tsx"),
      "utf8",
    );

    const knownMojibake = [
      "MARR\u00C3\u02DCN",
      "Ernestus\u00E2\u20AC\u2122",
      "Om Unit \u00E2\u20AC\u201C Acid Dub Studies (live)",
      "22:00\u00E2\u2020\u201901:00",
      "Click \u00E2\u20AC\u0153Add preview\u00E2\u20AC\u009D",
      "\uFFFD",
    ];

    for (const badText of knownMojibake) {
      expect(pageSource).not.toContain(badText);
    }
  });
});
