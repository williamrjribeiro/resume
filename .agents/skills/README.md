# Project agent skills

Canonical Agent Skills for this repository. Claude Code loads the same trees via `.claude/skills/<name>` symlinks — edit only here.

## First-party

| Skill | Purpose |
| --- | --- |
| [`repo-conventions`](./repo-conventions/SKILL.md) | Bun tooling, quality gates, hooks, commits, `bun check` |
| [`beads`](./beads/SKILL.md) | Beads issue tracking, issue types, sync, session completion |
| [`scotty`](./scotty/SKILL.md) | Beads UI in Docker or rootless Podman: `SCOTTY_USER`, volumes, empty board, versions |
| [`bdd-bun-test`](./bdd-bun-test/SKILL.md) | BDD + `bun:test` rules |
| [`browser-verification`](./browser-verification/SKILL.md) | Checking pages in a browser with agent-browser only |

## Vendored (agent-browser)

From [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) **v0.38.2** (npm package `agent-browser`, also at `node_modules/agent-browser/skills/agent-browser`). Discovery stub plus the `skill-data/core` command guide, references, and templates. Do not run `npx skills add vercel-labs/agent-browser`; the files in this repo are enough. Excluded from rumdl like other vendored skills.

| Skill | Purpose |
| --- | --- |
| [`agent-browser`](./agent-browser/SKILL.md) | Browser automation CLI: open, snapshot, click, screenshot, diff |

## Adding a skill

1. Create `.agents/skills/<name>/SKILL.md`.
2. Link it for Claude Code: `ln -sfn ../../.agents/skills/<name> .claude/skills/<name>`.
3. Add a row to the table above.

Entrypoints: [`AGENTS.md`](../../AGENTS.md), [`CLAUDE.md`](../../CLAUDE.md).
