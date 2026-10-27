<script lang="ts">
  import { iconSvg } from "#lib/icons.ts";

  let { name }: { name: string } = $props();
  const svg = $derived(iconSvg(name));
</script>

{#if svg}
  {@html svg}
{:else}
  <span aria-hidden="true">{name}:&nbsp;</span>
{/if}
