import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// GitHub Pages serves this site from https://<user>.github.io/resume/, so CI sets BASE_PATH=/resume.
// Locally (and on a custom domain) it stays empty and the site is served from the root.
const base = process.env.BASE_PATH ?? "";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: { runes: true },
      // GitHub Pages shows 404.html for addresses that are not files, so the 404 page is the app's own.
      adapter: adapter({ pages: "build", assets: "build", fallback: "404.html", strict: true }),
      paths: { base: base as "" | `/${string}`, relative: true },
      prerender: { handleHttpError: "fail", handleMissingId: "fail" },
      // One small style sheet and no navigation between pages, so inlining it saves a request on the
      // way to the first paint and loses no caching.
      inlineStyleThreshold: 50_000,
      // The page never navigates, so there is nothing to refresh when a new version is deployed.
      version: { pollInterval: 0 },
      // The page loads nothing from anywhere else, so the policy allows nothing else. SvelteKit adds
      // the hashes of the inline script and style it writes into each page, and prerendered pages
      // carry the policy in a <meta> tag (`frame-ancestors` is not allowed there: the server sends it
      // as a header, see scripts/security-headers.ts). The dev server is left out, because Vite
      // injects inline scripts of its own.
      ...(command === "build" && {
        csp: {
          mode: "hash",
          directives: {
            "default-src": ["none"],
            "script-src": ["self"],
            "style-src": ["self"],
            // SvelteKit's route announcer, an accessibility live region, is made from a template with a
            // style attribute. Style attributes are the least risky thing to allow once scripts are not.
            "style-src-attr": ["unsafe-inline"],
            "img-src": ["self"],
            "font-src": ["self"],
            "connect-src": ["self"],
            "manifest-src": ["self"],
            "base-uri": ["none"],
            "form-action": ["none"],
            "object-src": ["none"],
            // Strings may reach DOM script sinks only through the policy Svelte creates for the HTML
            // it builds from its own templates.
            "require-trusted-types-for": ["script"],
            "trusted-types": ["svelte-trusted-html"],
          },
        },
      }),
    }),
  ],
}));
