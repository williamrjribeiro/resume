/** Putting the colours of a writing style on the page. */
import { describe, expect, it } from "bun:test";
import { originalTheme, type Theme } from "./styles.ts";
import { applyTheme, themeVariables } from "./theme.ts";

describe("theme", () => {
  const green: Theme = {
    primary: "#3a7d4e",
    secondary: "#9c7a4c",
    gradientFrom: "#1f4d33",
    gradientTo: "#6f9f5f",
    paper: "#f6faf4",
    tint: "#e1ecdc",
  };

  const page = () => {
    const properties = new Map<string, string>();
    const attributes = new Map<string, string>();
    return {
      properties,
      attributes,
      targets: {
        root: {
          setProperty: (name: string, value: string) => void properties.set(name, value),
          removeProperty: (name: string) => {
            const old = properties.get(name) ?? "";
            properties.delete(name);
            return old;
          },
        },
        themeColor: {
          setAttribute: (name: string, value: string) => void attributes.set(name, value),
        },
      },
    };
  };

  describe("applyTheme", () => {
    it("sets each colour of the theme as the CSS variable the style sheet uses", () => {
      const { properties, targets } = page();
      applyTheme(targets, green);
      expect(Object.fromEntries(properties)).toEqual({
        "--color-primary": "#3a7d4e",
        "--color-secondary": "#9c7a4c",
        "--color-gradient-from": "#1f4d33",
        "--color-gradient-to": "#6f9f5f",
        "--color-paper": "#f6faf4",
        "--color-gray-light": "#e1ecdc",
      });
    });

    it("tells the browser the primary colour, for its address bar", () => {
      const { attributes, targets } = page();
      applyTheme(targets, green);
      expect(attributes.get("content")).toBe("#3a7d4e");
    });

    it("leaves the style sheet's own colours when the theme is the original's", () => {
      const { properties, attributes, targets } = page();
      applyTheme(targets, green);
      applyTheme(targets, originalTheme);
      expect(properties.size).toBe(0);
      expect(attributes.get("content")).toBe(originalTheme.primary);
    });

    it("copes with a page that has no theme-color tag", () => {
      const { properties, targets } = page();
      applyTheme({ ...targets, themeColor: null }, green);
      expect(properties.get("--color-primary")).toBe("#3a7d4e");
    });
  });

  describe("the style sheet", () => {
    it("declares every variable of a theme, with the original's colour", async () => {
      const css = await Bun.file(`${import.meta.dir}/../styles.css`).text();
      for (const [key, variable] of Object.entries(themeVariables)) {
        expect(css, variable).toContain(`${variable}: ${originalTheme[key as keyof Theme]};`);
      }
    });
  });
});
