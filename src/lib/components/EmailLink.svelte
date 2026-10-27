<script lang="ts">
  import { obfuscate } from "#lib/format.ts";
  import { iconSvg } from "#lib/icons.ts";

  let {
    email,
    label,
    showText = false,
    class: className = "",
  }: { email: string; label: string; showText?: boolean; class?: string } = $props();

  // The address is written as HTML entities in both the link and its text, which Svelte would escape
  // again, so the whole link is rendered as HTML.
  const encoded = $derived(obfuscate(email));
  const html = $derived(
    `<a class="${className}" href="mailto:${encoded}"${showText ? "" : ` aria-label="${label}"`}>` +
      (iconSvg("email") ?? "") +
      (showText ? `<span>${encoded}</span>` : "") +
      "</a>",
  );
</script>

{@html html}
