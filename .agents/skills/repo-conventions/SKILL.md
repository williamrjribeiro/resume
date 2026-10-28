---
name: repo-conventions
description: >
  Repository conventions for this Bun starter — Bun-only tooling, workspace
  layout, quality gates, Lefthook hooks, Conventional Commits, Tailwind CSS,
  SvelteKit, type checking with `bun check`, and reference repositories in
  repos/. Use when starting work in this repository, choosing tools, running
  checks, committing, or when AGENTS.md / CLAUDE.md point here.
---

# Repo conventions

Bun-based repository for William's résumé: a static Svelte 5 + Tailwind CSS 4 site (SvelteKit with `adapter-static`) published to GitHub Pages. The tooling comes from the `bun-agentic-starter` template. License: MIT.

## Invoke related skills

| Topic | Skill |
| --- | --- |
| Svelte / SvelteKit code | `svelte` |
| Tests (BDD + `bun:test`) | `bdd-bun-test` |
| A web page in a browser | `agent-browser` |

## Workspace layout

- `apps/*` — applications (none yet)
- `packages/*` — shared libraries (none yet)
- `scripts/` — repository scripts and their tests
- `test/` — test setup (`setup.ts`, preloaded by `bunfig.toml`) and `test/support/` helpers that export functions. Tests sit next to the code as `*.test.ts`
- `src/` — the site: `routes/` (the one page), `lib/` (components, data, content loader; imported as `#lib/...`), `content/` (the résumé's Markdown), `assets/` (fonts, icons), `styles.css` (Tailwind CSS entry; configuration lives in CSS, there is no `tailwind.config.js`)
- `static/` — files served as they are (avatar, favicons, manifest, robots.txt)
- `vite.config.ts` — Vite, SvelteKit and Tailwind configuration (SvelteKit 3 has no `svelte.config.js`)
- `repos/*` — read-only reference clones (git-ignored, listed in `repos.json`). Never edit or import from them

Do not invent new apps or packages unless asked.

## Tooling (Bun only)

Do not introduce npm, yarn, or pnpm.

```bash
bun install
bun run verify         # pre-commit gates in parallel
bun run ci             # verify + Tailwind build
bun run fmt / fmt:check          # oxfmt
bun run lint / lint:fix          # oxlint
bun run typecheck                # bun check
bun run test                     # bun test
bun run md:check / md:fmt / md:fmt:check   # rumdl
bun run dev / build / preview    # Vite dev server; static site in build/
bun run check:hcard              # the built page must carry the author's h-card
bun run check:svelte             # svelte-check over the .svelte files (through bunx, see the svelte skill)
bun run check:security           # the built pages carry a strict CSP (Google's evaluator)
bun run lighthouse               # best practices over the build; fails on any Trust and Safety finding (docs/security.md)
bun run release:patch|minor|major   # bump, tag and push: publishes the site (README, "Release"). Only when asked
bun run prd                      # build, serve build/ over HTTPS
bun run serve:https              # serve SERVE_DIR (default dist) over HTTPS: HTTP/3, HTTP/2, HTTP/1.1, brotli
bun run certs / certs:clean      # local HTTPS certificate in .certs/
```

- Root `workspaces.catalog` pins shared deps (`"catalog:"`). Workspace-specific deps stay in that package's `package.json`.
- New scripts use Bun-native APIs (`Bun.file`, `Bun.write`, `Bun.$`, `Bun.spawn` / `Bun.spawnSync`, `Bun.Glob`, `import.meta.dir`, `Bun.env`).
- Prefer local Bun types docs under `node_modules/.bun/bun-types@*/…/docs/` over the network.
- Do **not** add ESLint, Prettier, or Playwright/Puppeteer. Formatting and linting are OXC (`oxfmt`, `oxlint`).

## Type checking

Type checking is `bun check` (it embeds TypeScript), not `tsc`. There is no `typescript` package and none may be added. `bun check` cannot read `.svelte` files, so `bun run check:svelte` runs `svelte-check` at a pinned version through `bunx` instead (the one use of TypeScript outside Bun). Keep logic in `.ts` modules, where `bun check` covers it. A root package script named `check` would shadow `bun check`; use `bun --check` then. Extend the root `tsconfig.json`. `exactOptionalPropertyTypes` is on.

## Local HTTPS

`scripts/certs.ts` makes a certificate in `.certs/` (git-ignored, never commit the key) with `mkcert` when installed, else a self-signed `openssl` one. `scripts/serve-https.ts` serves a build directory with it. Arch Linux only for now. Details in docs/local-https.md.

## Git hooks (Lefthook)

`bun install` runs `scripts/install-git-hooks.ts` (`prepare`) so Lefthook hooks are in `.git/hooks`. It skips when `CI=true`.

- **pre-commit:** `bun run verify` (format is checked, not fixed — run `bun run fmt` / `md:fmt`, then stage)
- **commit-msg:** Conventional Commits via `scripts/check-commit-subject.ts`
- Never bypass hooks (`--no-verify`, `LEFTHOOK=0`)

## Reference repositories

`bun install` / `bun run vendor` shallow-clones `repos.json` into `repos/<name>`. Skipped when `CI=true` or `SKIP_VENDORED_REPOS=1`. Read library source and tests there before relying on behaviour.

## Commits

- Atomic commits; Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`)
- Commit only when the user asks or repo policy authorizes it

## Source changes

Do not change unrelated source. Match existing style. Prefer small, focused edits.
