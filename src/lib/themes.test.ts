/** The colours of the writing styles. A palette that looks right is not enough: the text on it has to read. */
import { describe, expect, it } from "bun:test";
import { contrastRatio } from "../../test/support/contrast.ts";
import { writingStyles } from "./data/styles.ts";
import { originalTheme } from "./styles.ts";

describe("the themes of the writing styles", () => {
  const grayDark = "#55595c";
  const grayMuted = "#4a5257";
  const white = "#ffffff";

  it("are written as #rrggbb", () => {
    for (const { id, theme } of writingStyles) {
      const colors = Object.values(theme).flat();
      for (const color of colors) {
        expect(color, id).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it("use several colours each, so the character can be recognized", () => {
    for (const { id, theme } of writingStyles) {
      const distinct = new Set([
        theme.primary,
        theme.secondary,
        theme.accent,
        theme.highlight,
        ...theme.sidebar,
      ]);
      expect(distinct.size, id).toBeGreaterThanOrEqual(6);
      expect(theme.sidebar.length, id).toBeGreaterThanOrEqual(4);
    }
  });

  it("are all different from the original's and from each other's", () => {
    const primaries = [originalTheme, ...writingStyles.map((style) => style.theme)].map(
      (theme) => theme.primary,
    );
    expect(new Set(primaries).size).toBe(primaries.length);
    const themes = writingStyles.map((style) => JSON.stringify(style.theme));
    expect(new Set(themes).size).toBe(themes.length);
  });

  describe.each(writingStyles.map((style) => [style.id, style.theme] as const))(
    "%s",
    (_id, theme) => {
      it("keeps links and small headings readable on the page (4.5:1)", () => {
        expect(contrastRatio(theme.primary, theme.paper)).toBeGreaterThanOrEqual(4.5);
      });

      it("keeps selected text readable, white on the primary colour (4.5:1)", () => {
        expect(contrastRatio(white, theme.primary)).toBeGreaterThanOrEqual(4.5);
      });

      it("keeps the text readable on the page and on the footer (7:1 for the ink, 4.5:1 for the greys)", () => {
        expect(contrastRatio(theme.ink, theme.paper)).toBeGreaterThanOrEqual(7);
        expect(contrastRatio(theme.ink, theme.tint)).toBeGreaterThanOrEqual(7);
        for (const text of [grayDark, grayMuted]) {
          expect(contrastRatio(text, theme.paper)).toBeGreaterThanOrEqual(4.5);
        }
        expect(contrastRatio(grayMuted, theme.tint)).toBeGreaterThanOrEqual(4.5);
      });

      it("keeps the focus outline visible on the page (3:1)", () => {
        expect(contrastRatio(theme.secondary, theme.paper)).toBeGreaterThanOrEqual(3);
      });

      it("keeps the accent colours visible on the page (1.5:1)", () => {
        for (const color of [theme.accent, theme.highlight]) {
          expect(contrastRatio(color, theme.paper)).toBeGreaterThanOrEqual(1.5);
        }
      });

      it("keeps the white icons visible along the whole sidebar gradient (3:1)", () => {
        for (const stop of theme.sidebar) {
          expect(contrastRatio(white, stop)).toBeGreaterThanOrEqual(3);
        }
      });
    },
  );
});
