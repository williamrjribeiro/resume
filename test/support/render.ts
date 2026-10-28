import type { Component } from "svelte";
import { render } from "svelte/server";

export interface Rendered {
  /** The markup the component renders in the page body. */
  readonly body: string;
  /** What it puts in `<svelte:head>`. */
  readonly head: string;
}

/** Drops the comments Svelte leaves in server output for hydration, which say nothing about the markup. */
function withoutMarkers(html: string): string {
  return html.replace(/<!--[^]*?-->/g, "");
}

/** Renders a component on the server, the way SvelteKit prerenders it. */
export function renderComponent<Props extends Record<string, unknown>>(
  component: Component<Props>,
  props: Props,
): Rendered {
  const { body, head } = render(component, { props });
  return { body: withoutMarkers(body), head: withoutMarkers(head) };
}
