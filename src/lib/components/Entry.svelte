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

<article class="break-inside-avoid">
  <div class="flex flex-col not-last:mb-2 print:mb-1">
    <h3 class="p-name print:mb-0.5 print:text-base print:leading-[1.1]">{entry.title}</h3>

    <p
      class="order-first mb-1 text-sm tracking-[0.125em] text-gray-muted uppercase print:mb-0.5 print:text-[0.7rem] print:tracking-[0.05em]"
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
      <p class="text-lg print:text-[0.9rem]">
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
      <p class="text-lg print:text-[0.9rem]">
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
    <div class="p-summary e-content markdown max-w-[60ch] print:max-w-none print:text-[0.85rem] print:leading-tight">
      <!-- The Markdown comes from src/content, which the site owner writes. -->
      {@html entry.html}
    </div>
  {/if}
</article>
