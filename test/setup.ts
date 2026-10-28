/**
 * Preloaded by `bun test` (see bunfig.toml): lets tests render the site's components on the server.
 * It replaces what only SvelteKit and Vite provide: `$app/paths` and `import.meta.glob`, which the
 * icon lookup and the server-side résumé use.
 */
import { mock } from "bun:test";
import { buildResume, buildStyles } from "../src/lib/content.ts";
import { writingStyles } from "../src/lib/data/styles.ts";
import { createIconLookup } from "../src/lib/icons.ts";
import { loadContentSources, loadIconSources, loadStyleSources } from "./support/files.ts";
import { registerSveltePlugin } from "./support/svelte-plugin.ts";

registerSveltePlugin();

// During prerendering the paths are relative to the page, which for the single page is `./`.
mock.module("$app/paths", () => ({
  asset: (file: string) => `./${file}`,
  resolve: (path: string, params: Record<string, string> = {}) =>
    `.${path.replace(/\[(\w+)\]/g, (_, name: string) => params[name] ?? "")}`,
}));

// Shallow navigation only happens in the browser, in answer to a click.
mock.module("$app/navigation", () => ({ goto: () => Promise.resolve() }));

const icons = createIconLookup(await loadIconSources());
mock.module("#lib/icon-lookup.ts", () => ({ iconSvg: icons }));

// The résumé and the writing styles the routes serve, read from the real files in src/content.
const resume = buildResume(await loadContentSources());
const styles = buildStyles(
  resume,
  writingStyles.map((style) => style.id),
  await loadStyleSources(),
);
mock.module("#lib/server/resume.ts", () => ({ resume, styles }));
