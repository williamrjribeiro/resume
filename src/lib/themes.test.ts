/** The colours of the writing styles. A palette that looks right is not enough: the text on it has to read. */
import { describe, expect, it } from "bun:test";
import { contrastRatio } from "../../test/support/contrast.ts";
import { writingStyles } from "./data/styles.ts";
import { originalTheme, type Theme } from "./styles.ts";

describe("the themes of the writing styles", () => {
  const ink = "#373a3c";
  const grayDark = "#55595c";
  const grayMuted = "#4a5257";
  const white = "#ffffff";
  const colors = (theme: Theme) => Object.values(theme);

  it("are written as #rrggbb", () => {
    for (const { id, theme } of writingStyles) {
      for (const color of colors(theme)) {
        expect(color, id).toMatch(/^#[0-9a-f]{6}$/);
      }
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
      it("keeps links and headings readable on the page (4.5:1)", () => {
        expect(contrastRatio(theme.primary, theme.paper)).toBeGreaterThanOrEqual(4.5);
      });

      it("keeps selected text readable, white on the primary colour (4.5:1)", () => {
        expect(contrastRatio(white, theme.primary)).toBeGreaterThanOrEqual(4.5);
      });

      it("keeps the body text and the grey text readable on the page and on the footer (4.5:1)", () => {
        for (const text of [ink, grayDark, grayMuted]) {
          expect(contrastRatio(text, theme.paper)).toBeGreaterThanOrEqual(4.5);
        }
        expect(contrastRatio(ink, theme.tint)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(grayMuted, theme.tint)).toBeGreaterThanOrEqual(4.5);
      });

      it("keeps the markers and the focus outline visible on the page (3:1)", () => {
        expect(contrastRatio(theme.secondary, theme.paper)).toBeGreaterThanOrEqual(3);
      });

      it("keeps the white icons visible on the sidebar, along its whole gradient (3:1)", () => {
        for (const stop of [theme.gradientFrom, theme.primary, theme.gradientTo]) {
          expect(contrastRatio(white, stop)).toBeGreaterThanOrEqual(3);
        }
      });
    },
  );
});
