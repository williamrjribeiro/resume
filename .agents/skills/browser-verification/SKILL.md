---
name: browser-verification
description: >
  How to check a web page in a real browser in this repository,
  using only agent-browser. Use when verifying UI changes, looking at a page or
  component, taking screenshots, comparing against a baseline, testing a viewport
  or dark mode, or serving a production build over HTTPS to try it.
---

# Browser verification

Use only `agent-browser` (`bunx agent-browser`) to interact with a web page: open, inspect, click, type, screenshot, compare. Do not use Playwright, Puppeteer, or other ad-hoc browser scripts. Load the [`agent-browser`](../agent-browser/SKILL.md) skill for the full command guide.

## Set up

Chrome for Testing is not an npm artifact. After `bun install`, run `bun scripts/install-agent-browser-chrome.ts` (skips when Chrome is already present), or `bunx agent-browser install` (`--with-deps` on Linux if launch fails on missing libraries). `bun install` in CI does not download Chrome.

## Steps

1. Start what you are checking:
   - The site: `bun run dev` (<http://localhost:5173>) or `bun run build && bun run preview`.
   - A production build over HTTPS: `bun run prd` (<https://localhost:4173>, see `docs/local-https.md`).
2. `bunx agent-browser open <url>`, then `bunx agent-browser set viewport <w> <h>`.
3. `bunx agent-browser snapshot -i` lists controls with role and accessible name. An unnamed control is a bug; fix the name rather than clicking by CSS.
4. `bunx agent-browser screenshot --annotate page.png` for a labeled picture of those refs.
5. Dark mode: `bunx agent-browser set media dark`.
6. Visual compare: save a baseline PNG, then `bunx agent-browser diff screenshot --baseline baseline.png`.

Browser-console warnings in a page or story are bugs. Keep screenshots out of git unless they are approved baselines.
