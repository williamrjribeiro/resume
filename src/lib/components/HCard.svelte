<script lang="ts">
  import { asset } from "$app/paths";
  import { author } from "#lib/data/author.ts";
  import { strings } from "#lib/data/site.ts";
  import { stripProtocol, stripSpaces } from "#lib/format.ts";
  import EmailLink from "./EmailLink.svelte";
  import Icon from "./Icon.svelte";

  const linkClass =
    "flex min-h-[3em] items-center gap-0.5 md:mr-4 md:inline-flex print:mr-3 print:inline-flex print:min-h-0";

  function scrollToTop() {
    // Smooth, unless the visitor asks for less motion: see `scroll-behavior` in src/styles.css.
    window.scrollTo({ top: 0 });
  }
</script>

<!--
  The person's h-card (https://microformats.org/wiki/h-card). Its `u-url` is also its `u-uid`, which is
  how parsers find the representative h-card of this page.
-->
<div class="h-card relative flex flex-wrap lg:py-8">
  <button
    type="button"
    onclick={scrollToTop}
    aria-label={strings.labels.scrollToTop}
    class="mr-8 size-44 shrink-0 cursor-pointer overflow-hidden rounded-full border-[5px] border-white bg-transparent p-0 shadow-elevated max-md:mx-auto max-md:transition-all max-md:group-data-scrolled:fixed max-md:group-data-scrolled:top-0 max-md:group-data-scrolled:-right-10 max-md:group-data-scrolled:z-10 max-md:group-data-scrolled:-translate-y-10 max-md:group-data-scrolled:scale-50 lg:fixed lg:top-[calc(2rem+1rem)] lg:right-3/4 lg:m-0 lg:translate-x-1/4 lg:transition-transform lg:group-data-scrolled:scale-75 print:static! print:m-0! print:size-[50px]! print:translate-x-0! print:scale-100! print:border-0!"
  >
    <!-- WebP where the browser can show it. The JPEG is the fallback, and is the `u-photo` that parsers read. -->
    <picture class="contents">
      <source srcset={asset("images/avatar.webp")} type="image/webp" />
      <img
        class="u-photo size-full object-cover"
        src={asset("images/avatar.jpg")}
        width="200"
        height="200"
        alt={author.name}
      />
    </picture>
  </button>

  <div class="pt-4 max-md:w-full print:flex-1 print:pt-0">
    <div class="flex flex-wrap items-baseline">
      <h1 class="p-name">{author.name}</h1>
      <em class="p-gender-identity ml-2 font-serif text-lg text-gray-dark">({author.pronouns})</em>
    </div>

    <p
      class="mb-4 max-w-[60ch] text-xl leading-normal font-light md:text-2xl print:mb-1 print:text-base"
    >
      <span class="p-job-title">{author.occupation}</span>
      <span aria-hidden="true">&middot;</span>
      <span class="p-adr h-adr">
        <span class="p-locality">{author.locality}</span>,
        <abbr class="p-country-name no-underline" title={author.countryName}>{author.country}</abbr>
      </span>
    </p>

    <div>
      <EmailLink
        email={author.email}
        label={strings.labels.email}
        showText
        class="u-email {linkClass}"
      />
      <a class="p-tel {linkClass}" href="tel:{stripSpaces(author.telephone)}">
        <Icon name="telephone" />
        <span>{author.telephone}</span>
      </a>
      <a class="u-url u-uid {linkClass}" href={author.website}>
        <Icon name="laptop" />
        <span>{stripProtocol(author.website)}</span>
      </a>

      <div class="md:flex md:flex-wrap print:flex print:flex-wrap">
        {#each author.social as social (social.name)}
          <a class="u-url {linkClass}" href={social.url} rel="me">
            <Icon name={social.name} />
            <span class="p-nickname">{social.user}</span>
            <span class="sr-only">on {social.name}</span>
          </a>
        {/each}
      </div>
    </div>
  </div>
</div>
