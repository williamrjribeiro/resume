import { plugin } from "bun";
import { compile } from "svelte/compiler";

/**
 * Lets `bun test` import `.svelte` files, compiled for server-side rendering (`svelte/server`).
 * `bun-plugin-svelte` does not support server output yet. Svelte strips the types of
 * `<script lang="ts">` itself, so no TypeScript preprocessor is needed.
 */
export function registerSveltePlugin(): void {
  plugin({
    name: "svelte-ssr",
    setup(build) {
      build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
        const source = await Bun.file(path).text();
        const { js } = compile(source, { filename: path, generate: "server", runes: true });
        return { contents: js.code, loader: "js" };
      });
    },
  });
}
