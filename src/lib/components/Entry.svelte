<script lang="ts">
  import type { Entry } from "#lib/content.ts";
  import { formatMonthYear } from "#lib/format.ts";
  import { strings } from "#lib/data/site.ts";

  interface Props {
    entry: Entry;
  }

  let { entry }: Props = $props();
  const hasLinks = $derived(entry.sourceCodeUrl !== undefined || entry.storeUrl !== undefined);
</script>

<!-- Print sets the dates on the right of the title, and lets a long entry run on to the next page. -->
<article class="break-inside-avoid print:break-inside-auto">
  <div
    class="flex flex-col not-last:mb-2 print:grid print:break-after-avoid print:grid-cols-[1fr_auto] print:items-baseline print:gap-x-4 print:not-last:mb-1"
  >
    <h3 class="p-name">{entry.title}</h3>

    <p
      class="order-first mb-1 text-sm tracking-[0.125em] text-gray-muted uppercase print:order-none print:col-start-2 print:row-start-1 print:mb-0 print:text-[0.8rem] print:tracking-[0.06em] print:whitespace-nowrap"
    >
      <time class="dt-start" datetime={entry.start}>{formatMonthYear(entry.start)}</time>
      <span>&ndash;</span>
      {#if entry.end}
        <time class="dt-end" datetime={entry.end}>{formatMonthYear(entry.end)}</time>
      {:else}
        <span>{strings.labels.present}</span>
      {/if}
    </p>

    {#if entry.organization}
      <p
        class="text-lg print:col-span-2 print:text-[0.95rem] print:leading-snug print:text-gray-dark"
      >
        <span class="p-org h-card">
          {#if entry.organizationUrl}
            <a
              href={entry.organizationUrl}
              class="p-name u-url"
              target="_blank"
              rel="noopener noreferrer">{entry.organization}</a
            >
          {:else}
            <span class="p-name">{entry.organization}</span>
          {/if}
        </span>
        {#if entry.location}
          <span aria-hidden="true">&middot;</span>
          <span class="p-location">{entry.location}</span>
        {/if}
      </p>
    {/if}

    {#if hasLinks}
      <p
        class="text-lg print:col-span-2 print:text-[0.95rem] print:leading-snug print:text-gray-dark"
      >
        {#if entry.sourceCodeUrl}
          <a href={entry.sourceCodeUrl} target="_blank" rel="noopener noreferrer"
            >{strings.labels.sourceCode}</a
          >
        {/if}
        {#if entry.sourceCodeUrl && entry.storeUrl}
          <span aria-hidden="true">&middot;</span>
        {/if}
        {#if entry.storeUrl}
          <a href={entry.storeUrl} target="_blank" rel="noopener noreferrer"
            >{strings.labels.appStore}</a
          >
        {/if}
      </p>
    {/if}
  </div>

  {#if entry.html}
    <div class="p-summary e-content markdown max-w-[60ch] print:max-w-none">
      <!-- The Markdown comes from src/content, which the site owner writes. -->
      {@html entry.html}
    </div>
  {/if}
</article>
