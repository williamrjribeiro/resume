<script lang="ts">
  import type { Entry as EntryData } from "#lib/content.ts";
  import Entry from "./Entry.svelte";

  interface Props {
    entries: ReadonlyArray<EntryData>;
    /** The microformats2 property the entries are of, such as `p-experience`. */
    property: string;
  }

  let { entries, property }: Props = $props();
</script>

<!-- Newest first, which `reversed` tells assistive technology. -->
<ol
  reversed
  class="relative pl-4 before:absolute before:top-9 before:bottom-0 before:left-4 before:w-px before:bg-[linear-gradient(to_top,rgb(129_138_145_/_0)_0%,var(--color-gray)_100px,var(--color-gray)_100%)] print:pl-3 print:before:top-6 print:before:left-3"
>
  {#each entries as entry (entry.id)}
    <li
      class={[
        "h-event",
        property,
        "relative pl-8 before:absolute before:top-9 before:left-0 before:size-2.5 before:-translate-x-1/2 before:rounded-full before:bg-secondary not-first:mt-8 print:pl-4 print:before:top-6 print:before:size-2 print:not-first:mt-2.5",
        entry.printHidden && "print:hidden",
      ]}
    >
      <Entry {entry} />
    </li>
  {/each}
</ol>
