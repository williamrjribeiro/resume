/** Putting the colours of a writing style on the page. */
import { describe, expect, it } from "bun:test";
import { originalTheme, type Theme } from "./styles.ts";
import { applyTheme, themeVariables } from "./theme.ts";

describe("theme", () => {
  const green: Theme = {
    primary: "#4f7a3a",
    secondary: "#7a5d43",
    accent: "#8ea66c",
    highlight: "#1dbf2a",
    sidebar: ["#1a2a1d", "#4f7a3a", "#7a5d43"],
    paper: "#f4faf0",
    tint: "#e0eed7",
    ink: "#212b1c",
  };

  const page = () => {
    const properties = new Map<string, string>();
    const attributes = new Map<string, string>();
    const flags = new Set<string>();
    return {
      properties,
      attributes,
      flags,
      targets: {
        root: {
          style: {
            setProperty: (name: string, value: string) => void properties.set(name, value),
            removeProperty: (name: string) => {
              const old = properties.get(name) ?? "";
              properties.delete(name);
              return old;
            },
          },
          toggleAttribute: (name: string, force?: boolean) => {
            if (force) {
              flags.add(name);
            } else {
              flags.delete(name);
            }
            return force ?? false;
          },
        },
        themeColor: {
          setAttribute: (name: string, value: string) => void attributes.set(name, value),
        },
      },
    };
  };

  describe("themeVariables", () => {
    it("maps each colour of the theme to the CSS variable the style sheet uses", () => {
      expect(themeVariables(green)).toMatchObject({
        "--color-primary": "#4f7a3a",
        "--color-secondary": "#7a5d43",
        "--color-accent": "#8ea66c",
        "--color-highlight": "#1dbf2a",
        "--color-paper": "#f4faf0",
        "--color-gray-light": "#e0eed7",
        "--color-ink": "#212b1c",
      });
    });

    it("builds the sidebar's gradient from every stop, in order", () => {
      expect(themeVariables(green)["--sidebar-gradient"]).toBe(
        "linear-gradient(230deg, #1a2a1d, #4f7a3a, #7a5d43)",
      );
    });

    it("builds a stripe from the four colours that make the character recognizable", () => {
      expect(themeVariables(green)["--palette-stripe"]).toBe(
        "linear-gradient(90deg, #4f7a3a, #7a5d43, #8ea66c, #1dbf2a)",
      );
    });
  });

  describe("applyTheme", () => {
    it("sets every variable of the theme on the page and marks the page as themed", () => {
      const { properties, flags, targets } = page();
      applyTheme(targets, green);
      expect(Object.fromEntries(properties)).toEqual(themeVariables(green));
      expect(flags.has("data-themed")).toBe(true);
    });

    it("tells the browser the primary colour, for its address bar", () => {
      const { attributes, targets } = page();
      applyTheme(targets, green);
      expect(attributes.get("content")).toBe("#4f7a3a");
    });

    it("leaves the style sheet's own colours when the theme is the original's", () => {
      const { properties, flags, attributes, targets } = page();
      applyTheme(targets, green);
      applyTheme(targets, originalTheme);
      expect(properties.size).toBe(0);
      expect(flags.has("data-themed")).toBe(false);
      expect(attributes.get("content")).toBe(originalTheme.primary);
    });

    it("copes with a page that has no theme-color tag", () => {
      const { properties, targets } = page();
      applyTheme({ ...targets, themeColor: null }, green);
      expect(properties.get("--color-primary")).toBe("#4f7a3a");
    });
  });

  describe("the style sheet", () => {
    it("declares the original's colours, so the original needs no theme set on the page", async () => {
      const css = await Bun.file(`${import.meta.dir}/../styles.css`).text();
      const { "--palette-stripe": _stripe, ...original } = themeVariables(originalTheme);
      for (const [variable, value] of Object.entries(original)) {
        expect(css, variable).toContain(`${variable}: ${value}`);
      }
    });
  });
});
