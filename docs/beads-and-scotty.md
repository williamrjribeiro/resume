# Beads and Scotty

## Beads

Issues live in a local Dolt database; sync uses `refs/dolt/data` on the git remote. `.beads/issues.jsonl` is a passive export. `@beads/bd` is a dev dependency, so run it as `bun x bd <cmd>` (or `bun run bd -- <cmd>`).

```bash
bun x bd ready             # find available work
bun run beads:latest       # bd dolt pull — before reading or changing issues
bun run beads:push         # bd dolt push — after create, update, close
bun run bd:hooks           # chain the bd git hooks, if wanted
```

Agent workflow: the `beads` skill and `bd prime` (a Claude Code session hook in `.claude/settings.json` runs it).

## Beads UI (Scotty)

Scotty runs in a container built by `compose.yaml` and `docker/scotty/Dockerfile`. You need Docker, **or** Podman with Docker CLI compatibility (`podman-docker` on Arch) so `docker compose` works.

```bash
bun run scotty:up          # beads:latest, then build and start; prints http://localhost:3000
bun run scotty:logs
bun run scotty:down
```

On **rootless Podman** the container cannot read `.beads/` as its default user: run `SCOTTY_USER=0:0 bun run scotty:up`.

The full runbook (permissions for Docker and Podman, the config volume, recovering an empty board, bumping versions, a symptom table) is the [`scotty` skill](../.agents/skills/scotty/SKILL.md).
