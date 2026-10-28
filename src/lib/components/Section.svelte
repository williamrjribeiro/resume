<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  interface Props {
    id: string;
    title?: string;
    class?: ClassValue;
    children: Snippet;
  }

  let { id, title, class: className, children }: Props = $props();
</script>

<section {id} class={["break-inside-avoid py-8 print:pt-4 print:pb-0", className]}>
  {#if title}
    <h2 class="mb-8 border-b border-gray pb-2 print:mb-2 print:border-[#d5dadd] print:pb-1">
      {title}
    </h2>
  {/if}
  {@render children()}
</section>
