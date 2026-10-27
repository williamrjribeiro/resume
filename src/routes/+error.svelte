<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import { author } from "#lib/data/author.ts";
</script>

<svelte:head>
  <title>{page.status} - {author.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="gutter flex min-h-screen flex-col items-start justify-center gap-4 py-16">
  <h1>{page.status}</h1>
  <p class="text-xl font-light">
    {page.status === 404 ? "There is nothing at this address." : "Something went wrong."}
  </p>
  <a href={resolve("/")}>Back to the résumé of {author.name}</a>
</main>
