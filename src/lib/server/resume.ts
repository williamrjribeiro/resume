import { buildResume } from "#lib/content.ts";

const sources = import.meta.glob<string>("/src/content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The résumé, parsed once when the site is prerendered. */
export const resume = buildResume(sources);
