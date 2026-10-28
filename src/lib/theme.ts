import { originalTheme, type Theme } from "./styles.ts";

/** The CSS variable each colour of a theme replaces, as `src/styles.css` declares them. */
export const themeVariables = {
  primary: "--color-primary",
  secondary: "--color-secondary",
  gradientFrom: "--color-gradient-from",
  gradientTo: "--color-gradient-to",
  paper: "--color-paper",
  tint: "--color-gray-light",
} as const satisfies Record<keyof Theme, string>;

/** The two things of the page that colours reach without CSS: its root element and the browser's `theme-color`. */
export interface ThemeTargets {
  readonly root: Pick<CSSStyleDeclaration, "setProperty" | "removeProperty">;
  readonly themeColor: { setAttribute(name: string, value: string): void } | null;
}

/**
 * Puts a theme on the page. The original theme removes what an earlier one set, which leaves the style sheet's
 * own colours, the ones the page was prerendered with.
 */
export function applyTheme({ root, themeColor }: ThemeTargets, theme: Theme): void {
  for (const [key, variable] of Object.entries(themeVariables)) {
    if (theme === originalTheme) {
      root.removeProperty(variable);
    } else {
      root.setProperty(variable, theme[key as keyof Theme]);
    }
  }
  themeColor?.setAttribute("content", theme.primary);
}
