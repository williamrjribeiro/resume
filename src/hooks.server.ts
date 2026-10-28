import type { Handle } from "@sveltejs/kit/hooks";

// The Butler heading font is used above the fold, so load it with the page instead of after the CSS.
// Only the woff2 file: every browser that runs this site reads it, so the woff fallback stays unfetched.
export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    preload: (input) =>
      input.type === "font" ? input.filename.endsWith(".woff2") : input.type !== "asset",
  });
