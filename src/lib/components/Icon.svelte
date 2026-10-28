<script lang="ts">
  import { iconSvg } from "#lib/icon-lookup.ts";

  interface Props {
    /** The name of a file in src/assets/icons, or of a network ("GitHub"). */
    name: string;
  }

  let { name }: Props = $props();
  const svg = $derived(iconSvg(name));
</script>

{#if svg}
  <!-- The SVG comes from src/assets/icons, which is part of this repository. -->
  {@html svg}
{:else}
  <span aria-hidden="true">{name}:&nbsp;</span>
{/if}
