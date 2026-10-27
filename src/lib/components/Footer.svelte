<script lang="ts">
  import { author } from "#lib/data/author.ts";
  import { strings } from "#lib/data/site.ts";
  import { formatBuildDate } from "#lib/format.ts";

  interface Props {
    /** When the site was built, as an ISO timestamp. */
    builtAt: string;
  }

  let { builtAt }: Props = $props();
</script>

<footer class="bg-gray-light py-8 lg:col-start-2 lg:row-start-3 print:hidden">
  <div class="gutter flex flex-wrap justify-between">
    <p>&copy; {author.name}</p>
    <p>{strings.labels.lastUpdated}: {formatBuildDate(builtAt)}</p>
  </div>
</footer>
