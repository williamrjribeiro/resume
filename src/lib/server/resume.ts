import { buildResume, buildStyles } from "#lib/content.ts";
import { writingStyles } from "#lib/data/styles.ts";

// The writing styles live in src/content/styles; the résumé itself is everything else in src/content.
const sources = import.meta.glob<string>(["/src/content/**/*.md", "!/src/content/styles/**"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const styleSources = import.meta.glob<string>("/src/content/styles/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The résumé, parsed once when the site is prerendered. */
export const resume = buildResume(sources);

/** The text of every writing style, by id. */
export const styles = buildStyles(
  resume,
  writingStyles.map((style) => style.id),
  styleSources,
);
