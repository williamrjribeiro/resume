# AGENTS.md

Skills in [`.agents/skills/`](./.agents/skills/README.md) (Claude Code: `.claude/skills/`) hold the details. Start with `repo-conventions`.

- Bun only. Type check with `bun check`; never add `typescript`.
- Track work in Beads (`bd`, skill `beads`), not markdown TODOs.
- Browsers: `agent-browser` only (skill `browser-verification`).
- Run `bun run verify` before finishing. Never bypass hooks. Commit or push only when asked.
