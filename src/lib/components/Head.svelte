<script lang="ts">
  import { asset } from "$app/paths";
  import { author } from "#lib/data/author.ts";
  import { site } from "#lib/data/site.ts";
  import { jsonLdScript } from "#lib/json-ld.ts";

  const place = `${author.locality}, ${author.country}`;
  const title = `${author.name} - ${author.occupation} in ${place}`;
  const description = `Online Resume of ${author.name}`;
  const image = new URL("images/avatar.jpg", site.url).href;

  const jsonLd = jsonLdScript(author, site.url, image);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={site.url} />

  <meta name="format-detection" content="telephone=no" />
  <meta name="apple-mobile-web-app-title" content={title} />
  <meta name="application-name" content={title} />

  <meta property="og:site_name" content={title} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={site.url} />
  <meta property="og:locale" content={site.locale} />
  <meta property="og:type" content="profile" />
  <meta property="og:image" content={image} />
  <meta name="twitter:card" content="summary" />

  <link rel="apple-touch-icon" sizes="180x180" href={asset("favicon/apple-touch-icon.png")} />
  <link rel="icon" type="image/png" sizes="32x32" href={asset("favicon/favicon-32x32.png")} />
  <link rel="icon" type="image/png" sizes="16x16" href={asset("favicon/favicon-16x16.png")} />
  <link rel="shortcut icon" href={asset("favicon/favicon.ico")} />
  <link rel="manifest" href={asset("site.webmanifest")} />
  <link rel="mask-icon" href={asset("favicon/safari-pinned-tab.svg")} color={site.colors.primary} />
  <meta name="theme-color" content={site.colors.primary} />

  {@html jsonLd}
</svelte:head>
