// Side-effect style sheet imports are handled by Vite.
declare module "*.css";

// `bun check` cannot read `.svelte` files, so tests see them as components. `svelte-check` reads the real ones.
declare module "*.svelte" {
  import type { Component } from "svelte";
  const component: Component<Record<string, unknown>>;
  export default component;
}
