<script lang="ts">
  import { emailLinkHtml } from "#lib/email-link.ts";
  import { iconSvg } from "#lib/icon-lookup.ts";

  interface Props {
    email: string;
    label: string;
    showText?: boolean;
    class?: string;
  }

  let { email, label, showText = false, class: className = "" }: Props = $props();

  // The address is written as HTML entities, which Svelte would escape again, so the link is HTML.
  // Everything in it but the entities and the icon is escaped by `emailLinkHtml`.
  const html = $derived(emailLinkHtml({ email, label, icon: iconSvg("email"), showText, className }));
</script>

{@html html}
