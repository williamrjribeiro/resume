import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// GitHub Pages serves this site from https://<user>.github.io/resume/, so CI sets BASE_PATH=/resume.
// Locally (and on a custom domain) it stays empty and the site is served from the root.
const base = process.env.BASE_PATH ?? "";

export default defineConfig({
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
    }),
  ],
});
