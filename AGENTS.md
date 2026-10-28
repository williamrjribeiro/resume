# AGENTS.md

Skills in [`.agents/skills/`](./.agents/skills/README.md) (Claude Code: `.claude/skills/`) hold the details. Start with `repo-conventions`.

- Bun only. Type check with `bun check`; never add `typescript`.
- Svelte 5 and SvelteKit 3 differ from older versions: before writing Svelte code read the docs with `bunx @sveltejs/mcp` and follow skill `svelte`. Run its `svelte-autofixer` on every `.svelte` file and `bun run check:svelte`.
- Browsers: `agent-browser` only (skill `browser-verification`).
- Never run `bun run release:*` unless asked: it pushes to `master` and publishes the site.
- Run `bun run verify` before finishing. Never bypass hooks. Commit or push only when asked.
