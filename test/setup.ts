/**
 * Preloaded by `bun test` (see bunfig.toml): lets tests render the site's components on the server.
 * It replaces the two things only SvelteKit and Vite provide: `$app/paths` and `import.meta.glob`.
 */
import { mock } from "bun:test";
import { createIconLookup } from "../src/lib/icons.ts";
import { loadIconSources } from "./support/files.ts";
import { registerSveltePlugin } from "./support/svelte-plugin.ts";

registerSveltePlugin();

// During prerendering the paths are relative to the page, which for the single page is `./`.
mock.module("$app/paths", () => ({
  asset: (file: string) => `./${file}`,
  resolve: (path: string) => `.${path}`,
}));

const icons = createIconLookup(await loadIconSources());
mock.module("#lib/icon-lookup.ts", () => ({ iconSvg: icons }));
