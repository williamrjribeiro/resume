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
      adapter: adapter({ pages: "build", assets: "build", strict: true }),
      paths: { base: base as "" | `/${string}`, relative: true },
      prerender: { handleHttpError: "fail", handleMissingId: "fail" },
    }),
  ],
  define: {
    // Shown in the footer as "Last updated". Baked in at build time so the prerendered HTML and
    // the hydrated page agree.
    SITE_BUILD_TIME: JSON.stringify(new Date().toISOString()),
  },
});
