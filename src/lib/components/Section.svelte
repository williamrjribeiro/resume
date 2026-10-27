<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    id,
    title,
    class: className = "",
    children,
  }: { id: string; title?: string; class?: string; children: Snippet } = $props();
</script>

<section {id} class="break-inside-avoid py-8 print:py-2 {className}">
  {#if title}
    <h2
      class="mb-8 border-b border-gray pb-2 print:mb-1.5 print:border-[#b5b5b5] print:pb-1 print:text-xl print:leading-[1.1]"
    >
      {title}
    </h2>
  {/if}
  {@render children()}
</section>
