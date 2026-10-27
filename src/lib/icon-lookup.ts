import { createIconLookup } from "./icons.ts";

// Vite-only: `import.meta.glob` does not exist elsewhere, so tests replace this module.
const sources = import.meta.glob<string>("/src/assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The inline SVG of an icon in src/assets/icons, found by name. */
export const iconSvg = createIconLookup(sources);
