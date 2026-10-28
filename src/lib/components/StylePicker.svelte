<script lang="ts">
  import { strings } from "#lib/data/site.ts";
  import { originalStyle, type WritingStyle } from "#lib/styles.ts";
  import type { ClassValue } from "svelte/elements";

  interface Props {
    /** Every style on offer, the original first. */
    styles: ReadonlyArray<WritingStyle>;
    /** The id of the style the page shows. */
    value: string;
    /** Off until the page has loaded its scripts, because the choice needs them. */
    disabled?: boolean;
    status?: "idle" | "loading" | "failed";
    onchange: (id: string) => void;
    class?: ClassValue;
  }

  let {
    styles,
    value,
    disabled = false,
    status = "idle",
    onchange,
    class: className,
  }: Props = $props();

  // The printed résumé has no drop-down. It names the style instead, unless the style is the original.
  const printedLabel = $derived(
    value === originalStyle.id ? undefined : styles.find((style) => style.id === value)?.label,
  );
</script>

<div class={className}>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm print:hidden">
    <label for="writing-style" class="text-gray-muted">{strings.labels.writingStyle}</label>
    <select
      id="writing-style"
      class="rounded-sm border border-gray bg-white px-2 py-1 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      {disabled}
      {value}
      onchange={(event) => onchange(event.currentTarget.value)}
    >
      {#each styles as style (style.id)}
        <option value={style.id}>{style.label}</option>
      {/each}
    </select>
    <span role="status" class="text-gray-muted">
      {#if status === "loading"}
        {strings.labels.styleLoading}
      {:else if status === "failed"}
        {strings.labels.styleFailed}
      {/if}
    </span>
  </div>
  {#if printedLabel}
    <p class="hidden text-xs text-gray-dark italic print:block">
      {strings.labels.inStyleOf}
      {printedLabel}
    </p>
  {/if}
</div>
