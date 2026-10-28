# WRJR Resume

[William R. J. Ribeiro](https://williamrjribeiro.github.io/resume/)'s online résumé: a static website built with [Svelte 5](https://svelte.dev) and [Tailwind CSS 4](https://tailwindcss.com), published to GitHub Pages by GitHub Actions.

The markup carries the [h-card microformat](https://microformats.org/wiki/h-card), so tools can read the contact details straight from the page. CI checks that it stays that way.

## Develop

Install [Bun](https://bun.com/docs/installation) at the version in `.bun-version`, then:

```bash
bun install
bun run dev        # http://localhost:5173 with live reload
bun run build      # the static site, in build/
bun run preview    # serve build/
bun run verify     # format, lint, Markdown, type check and tests
bun run check:svelte  # svelte-check: types and accessibility in the .svelte files
```

The tooling comes from the `bun-agentic-starter` template; see [AGENTS.md](./AGENTS.md) and the skills in [.agents/skills](./.agents/skills/README.md).

## Change the content

- Text and dates live in Markdown files with a YAML header in [src/content](./src/content): `work/`, `apps/`, `education/` and `volunteering/` hold one file per entry, `introduction.md` and `gap-year.md` are the free-form sections. Entries are sorted by `start`, newest first. `printHidden: true` leaves an entry out of the printed résumé.
- The name, contact details, skills, languages and social links are in [src/lib/data/author.ts](./src/lib/data/author.ts); the site URL and colours are in [src/lib/data/site.ts](./src/lib/data/site.ts).
- The avatar is `static/images/avatar.jpg` and its WebP twin `avatar.webp`; replace both together. Browsers that support WebP load it, the others fall back to the JPEG, which is also the address the h-card and the social cards use.
- The page is built from the components in [src/lib/components](./src/lib/components), styled with Tailwind utilities. The theme (colours, fonts, breakpoints) and the print layout are in [src/styles.css](./src/styles.css).

## Markup

- The header is a top-level `h-card` with `u-url` equal to `u-uid`, which is how parsers find the representative h-card of the page. Social links are `rel="me"`.
- The résumé itself is an `h-resume` whose jobs, degrees and apps are `h-event` items, each with its organisation as a nested `p-org h-card`.

## Security

The page has a strict Content Security Policy with Trusted Types, and `bun run serve:https` adds the headers a static host such as GitHub Pages cannot set: the policy again with `frame-ancestors`, HSTS, COOP and X-Frame-Options. `bun run lighthouse` runs Lighthouse's best practices over the build and fails on any finding in the Trust and Safety section; `bun run check:security` checks the policy of the built pages. GitHub Pages cannot send headers, so a few findings remain there. See [docs/security.md](./docs/security.md).

## For agents

- `/llms.txt` follows [llmstxt.org](https://llmstxt.org): the name, a summary, the introduction, and lists of links to the jobs, profiles and everything else. `/index.html.md` is the whole résumé as Markdown, which is what the spec calls the Markdown copy of the page at `/`.
- Both are made when the site is built, from the same data as the page ([src/lib/llms.ts](./src/lib/llms.ts)), so editing the content or `author.ts` updates them too. The page links to them from its `<head>`.
- They leave out the email address and the telephone number: the page writes the email address as HTML entities to keep it from scrapers, and a plain-text file made for crawlers would undo that.
- Lighthouse's `llms-txt` audit (the *agentic browsing* category, Lighthouse 13.6 or later) checks the file: `bunx lighthouse https://localhost:4173/ --only-categories=agentic-browsing`.

## Release

Pages are deployed from version tags, never from branches:

1. Set `version` in `package.json` (the deploy fails if it differs from the tag) and commit.
2. Create a release with a tag such as `v3.0.0` on GitHub, or run `git tag v3.0.0 && git push origin v3.0.0`.
3. The [Deploy](./.github/workflows/deploy.yml) workflow verifies and builds the site, publishes it to GitHub Pages and, when the tag came from `git push`, creates the GitHub Release with generated notes.

One-time repository settings:

- **Settings → Pages → Source** must be **GitHub Actions**.
- **Settings → Environments → github-pages → Deployment branches and tags** must allow the tag pattern `v*.*.*` (the default only allows the default branch).

The site is served from `/resume/`; the workflow takes `BASE_PATH` from the Pages configuration, so it is empty on a custom domain. Moving to one also means updating `site.url` and `author.website`.

## Credits

Thanks to [Max Böck](https://github.com/maxboeck/resume) for the design and the original source code of version 2.

## License

[MIT](./LICENSE)
