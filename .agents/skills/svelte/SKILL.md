---
name: svelte
description: >
  Svelte 5 and SvelteKit 3 in this repository — looking up the official documentation, checking
  components with the official autofixer and svelte-check, the runes conventions the code follows,
  and how components are tested. Use when writing or changing .svelte files, routes, vite.config.ts,
  hooks or the prerender setup, or when a Svelte or SvelteKit API is in doubt.
---

# Svelte and SvelteKit

The site is Svelte 5 (runes mode) on SvelteKit 3 with `adapter-static`. SvelteKit 3 differs from what most
training data knows, so read the documentation before relying on memory. Everything runs through Bun.

## Look it up

The official Svelte MCP server also ships as a CLI. Use `bunx`, never `npx`:

```bash
bunx @sveltejs/mcp list-sections                       # titles and paths of all documentation
bunx @sveltejs/mcp get-documentation 'svelte/$state,kit/$app-paths'
bunx @sveltejs/mcp svelte-autofixer src/lib/components/Entry.svelte --svelte-version 5.57.3
```

1. Run `list-sections` first, then `get-documentation` with every section the task touches. Quote section
   names so the shell keeps the `$`.
2. Run `svelte-autofixer` on every `.svelte` file you write, with the Svelte version from `package.json`.
   Repeat until it reports nothing. Its `{@html}` notice is expected here: see below.
3. Run `bun run check:svelte` (see below).

## Checks

- `bun run check:svelte` runs `svelte-check` over `tsconfig.svelte.json`: types and the compiler's
  accessibility and unused-CSS warnings in `.svelte` files. It runs through `bunx` at a pinned version because
  `svelte-check` needs the `typescript` package, which this repository does not depend on (type checking is
  `bun check`, which cannot read `.svelte`). CI runs it before every deploy.
- `bun run verify` does not run it, so the pre-commit hook stays fast and works offline.
- Oxfmt formats `.svelte` files (`"svelte": true` in `.oxfmtrc.json`, which needs the `svelte` package at runtime)
  and sorts their Tailwind classes against `src/styles.css` (`sortTailwindcss`). Run `bun run fmt` after editing
  them; `fmt:check` fails on unformatted ones.
- Oxlint lints the script blocks of `.svelte` files, not their markup. `env` in `.oxlintrc.json` predefines the
  runes (`svelte`) and the DOM (`browser`), and `no-undef` is on for `.svelte` files only. Markup, accessibility
  and unused CSS are `svelte-check`'s job.

## Conventions the code follows

- Runes only: `$props`, `$state`, `$derived`. No `export let`, `$:`, `on:click`, slots or stores. Derive values
  that depend on props with `$derived`, never copy them once.
- Describe props with an `interface Props` and pass `class` through as `ClassValue`. Build `class` values as
  arrays (`class={["base", flag && "extra", className]}`), not by interpolating strings.
- Key every `{#each}` block with a stable id, not the index.
- Listen to `window` with `<svelte:window>` and bind `scrollY` there. Use CSS, not JavaScript, for what CSS can
  do (reduced motion, print, breakpoints).
- Put logic in `.ts` modules next to the component (`email-link.ts`, `icons.ts`) so `bun check` covers it
  and a test can import it without Svelte.
- Import from `src/lib` as `#lib/...` with the file extension (SvelteKit 3 has no `$lib`). Configuration is in
  `vite.config.ts`, not `svelte.config.js`.
- `src/lib/server/` is server-only. `+page.server.ts` loads the résumé once, while the site is prerendered.
- `{@html}` is used for four things, all under the repository's control: the Markdown in `src/content`, the SVG
  icons in `src/assets/icons`, the JSON-LD script (its `<` is escaped) and the obfuscated email link (escaped by
  `emailLinkHtml`). Never pass it text from anywhere else.
- Static files (`static/`) are addressed with `asset()` from `$app/paths`, and routes with `resolve()`. Both
  return paths relative to the page, so the base path (`/resume` on GitHub Pages) needs no other handling.

## Tests

`bun test` renders the real components on the server, the way SvelteKit prerenders them.
`test/setup.ts` (preloaded by `bunfig.toml`) registers a Bun plugin that compiles `.svelte` files for
server output, and replaces `$app/paths` and `import.meta.glob`, which only SvelteKit and Vite provide.

- Render with `renderComponent` from `test/support/render.ts`, which returns the `body` and the `head` without
  Svelte's hydration comments. Pass snippets with `createRawSnippet` from `svelte`.
- Assert microformats with `parseMicroformats` from `test/support/microformats.ts` instead of matching strings.
- `src/routes/page.test.ts` renders the whole page from the real files in `src/content`.
- Follow the `bdd-bun-test` skill: `describe` and `it`, declarations inside the root `describe`.
