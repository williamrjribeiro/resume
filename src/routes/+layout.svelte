<script lang="ts">
  // oxlint-disable-next-line import/no-unassigned-import -- the style sheet is a side-effect import
  import "../styles.css";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
