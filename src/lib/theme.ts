import { originalTheme, type Theme } from "./styles.ts";

/** The CSS variables a theme sets, with their values. `src/styles.css` declares the original's. */
export function themeVariables(theme: Theme): Record<string, string> {
  return {
    "--color-primary": theme.primary,
    "--color-secondary": theme.secondary,
    "--color-accent": theme.accent,
    "--color-highlight": theme.highlight,
    "--color-paper": theme.paper,
    "--color-gray-light": theme.tint,
    "--color-ink": theme.ink,
    "--sidebar-gradient": `linear-gradient(230deg, ${theme.sidebar.join(", ")})`,
    "--palette-stripe": `linear-gradient(90deg, ${[theme.primary, theme.secondary, theme.accent, theme.highlight].join(", ")})`,
  };
}

/** The things of the page that colours reach: its root element, and the browser's `theme-color`. */
export interface ThemeTargets {
  readonly root: {
    readonly style: Pick<CSSStyleDeclaration, "setProperty" | "removeProperty">;
    toggleAttribute(name: string, force?: boolean): boolean;
  };
  readonly themeColor: { setAttribute(name: string, value: string): void } | null;
}

/**
 * Puts a theme on the page, and marks the page `data-themed`, which switches on the extra colours in the style
 * sheet. The original theme removes what an earlier one set, which leaves the style sheet's own colours: the ones
 * the page was prerendered with.
 */
export function applyTheme({ root, themeColor }: ThemeTargets, theme: Theme): void {
  const themed = theme !== originalTheme;
  for (const [variable, value] of Object.entries(themeVariables(theme))) {
    if (themed) {
      root.style.setProperty(variable, value);
    } else {
      root.style.removeProperty(variable);
    }
  }
  root.toggleAttribute("data-themed", themed);
  themeColor?.setAttribute("content", theme.primary);
}
