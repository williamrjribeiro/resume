<script lang="ts">
  import { author } from "#lib/data/author.ts";
  import { strings } from "#lib/data/site.ts";
  import { stripSpaces } from "#lib/format.ts";
  import EmailLink from "./EmailLink.svelte";
  import Icon from "./Icon.svelte";

  const buttonClass =
    "relative m-4 flex size-12 items-center justify-center rounded-full bg-transparent p-0 text-white no-underline hover:bg-black/25 focus-visible:bg-black/25 lg:mx-4 lg:my-2 " +
    "after:pointer-events-none after:absolute after:bottom-full after:left-1/2 after:-z-10 after:-translate-x-1/2 after:rounded-sm after:bg-black after:px-2 after:py-1 after:text-xs after:leading-none after:whitespace-nowrap after:opacity-0 after:transition-all after:content-[attr(aria-label)] hover:after:z-100 hover:after:-translate-y-1 hover:after:opacity-100";
</script>

<!-- The left column on wide screens; a band above the footer on narrow ones. -->
<aside
  class="animate-drift bg-primary bg-[linear-gradient(230deg,var(--color-gradient-from),var(--color-primary),var(--color-gradient-to))] bg-size-[300%_300%] lg:col-start-1 lg:row-span-3 lg:row-start-1 print:hidden"
>
  <div class="gutter">
    <div
      class="flex justify-center lg:fixed lg:top-[220px] lg:right-3/4 lg:flex-col lg:px-2 lg:text-right lg:group-[:not([data-scrolled])]:hidden"
    >
      <EmailLink email={author.email} label={strings.labels.email} class={buttonClass} />
      <a
        class={buttonClass}
        aria-label={strings.labels.telephone}
        href="tel:{stripSpaces(author.telephone)}"
      >
        <Icon name="telephone" />
      </a>
      <button
        type="button"
        class={buttonClass}
        aria-label={strings.labels.print}
        onclick={() => window.print()}
      >
        <Icon name="print" />
      </button>
    </div>
  </div>
</aside>
