---
name: scotty
description: >
  Run and troubleshoot Bead Me Up, Scotty, the local web UI for Beads, in Docker or
  rootless Podman. Use when starting or stopping the Beads UI, changing compose.yaml
  or docker/scotty/Dockerfile, fixing "permission denied" on .beads, SCOTTY_USER,
  podman-docker or docker compose problems, a Scotty board that shows 0 beads, the
  scotty-config volume, or bumping the Scotty or bd version.
---

# Scotty (Beads UI)

[Bead Me Up, Scotty](https://github.com/brendan-appstart/bead-me-up-scotty) is a local web board for the Beads database in `.beads/`. It is **not** an npm package: it runs in a container built from `docker/scotty/Dockerfile` and started by `compose.yaml`. The image uses **Bun only** (`oven/bun`), with no Node.js: `bun install` reads Scotty's `package-lock.json`, `bun --bun run build` builds Next.js, and `bun server.js` serves the standalone output. In the image `node` is just a symlink to `bun`. For `bd` itself (issues, sync), use the `beads` skill.

## Run it

```bash
bun run scotty:up      # beads:latest (pull), then build and start; prints http://localhost:3000
bun run scotty:logs
bun run scotty:down    # stop; keeps the config volume
bun run scotty:build   # build only
```

- `scotty:up` pulls Beads data first and **fails if the pull fails**, so the UI never starts on stale data. Pull alone: `bun run beads:latest`.
- Host port: `SCOTTY_PORT=3001 bun run scotty:up` (the container always listens on 3000).
- `compose.yaml` bind-mounts the repository root at `/data` and sets `BEADS_REPO=/data`. In the UI pick the mounted `/data` project, **not Demo**.
- The container name, image tag and compose project name come from the project name; the bootstrap step in the README renames them.

## Docker or Podman

`compose.yaml` is run with `docker compose`. Either:

- **Docker** (Docker Desktop or the daemon), or
- **Podman** with Docker CLI compatibility so `docker compose` works. On Arch: `sudo pacman -S podman podman-docker` (plus a compose provider such as `docker-compose` or `podman-compose`). The `podman-docker` package supplies the `docker` command; without it `bun run scotty:*` fails with `docker: command not found`.

This setup was verified on Arch Linux with rootless Podman. Other systems may need adjustments.

## Permissions: `SCOTTY_USER`

`.beads/` is often mode `600`/`700` (owned by you). The container runs as `${SCOTTY_USER:-1001:1001}`, the `nextjs` user of the image. Pick the row that matches the engine:

| Engine | Setting | Why |
| --- | --- | --- |
| **Rootless Podman** | `SCOTTY_USER=0:0 bun run scotty:up` | Container root is mapped to your host user, so it can read `.beads`. |
| Rootless Podman, keep the image user | `chmod -R a+rX .beads` (add write bits if the UI must write) | Opens `.beads` to the remapped uid `1001`. |
| Docker Desktop or rootful Docker | `SCOTTY_USER="$(id -u):$(id -g)" bun run scotty:up` | Maps the host user directly. |

Notes:

- `SCOTTY_USER="$(id -u):$(id -g)"` does **not** fix rootless Podman: your host uid is remapped again and still misses `.beads`. Use `0:0` there.
- The usual symptom is `permission denied` on `/data/.beads/embeddeddolt`. It always means this section.
- To keep the setting, put `SCOTTY_USER=0:0` in a git-ignored `.env`; compose reads it.

## Config volume

Scotty's settings live in the `scotty-config` volume, mounted at `/home/nextjs/.config/bead-me-up-scotty`. It survives `bun run scotty:down` and is removed by `docker compose down -v`. The Dockerfile creates that directory with mode `0777`, so the volume is writable by `1001:1001`, a host uid and rootless `0:0`. If a volume from an older image was created root-owned and the UI cannot save settings, recreate it: `docker compose down -v`, then `bun run scotty:up`.

## Dolt sync stays on the host

The image has no git. UI edits call the in-container `bd`, which changes the local database. **Pull and push stay on the host:** `bun run beads:latest` and `bun run beads:push`. Never try to sync from inside the container.

## Empty board (`0 beads`)

Scotty can open `/data` with no error and still show `0 beads` when the local Dolt database is empty or has diverged from the remote.

1. Confirm: `bun x bd stats` shows Total Issues `0`.
2. Confirm the remote has data: `git ls-remote origin refs/dolt/data` (a SHA means history exists).
3. Try a normal pull: `bun run beads:latest`.
4. If the pull fails with **no common ancestor** or divergent histories:
   - `bun run scotty:down`
   - Move the empty database aside, and do not delete it until recovery works: `mv .beads/embeddeddolt ".beads/embeddeddolt.empty-$(date +%Y%m%d-%H%M%S)"`
   - Re-clone from the remote: `bun x bd bootstrap -y`
   - `bun x bd stats` must show a non-zero total
   - `bun run scotty:up` (`SCOTTY_USER=0:0` on rootless Podman)
5. **Never** `bd dolt push --force` (or otherwise overwrite the remote) from an empty local database.

A brand-new project legitimately has `0 beads`; check that `refs/dolt/data` exists on the remote before treating it as a fault.

## Versions

- Scotty is pinned in `compose.yaml` (`SCOTTY_VERSION`, image tag) and in the Dockerfile `ARG` defaults. The Dockerfile clones that upstream tag.
- `BUN_VERSION` (Dockerfile `ARG`, default `1.4.4`) is the Bun inside the image; it is independent of `.bun-version`. Images are named `docker.io/oven/bun:...` so rootless Podman can resolve them without a short-name registry config.
- The bundled `bd` (`BD_VERSION`) must match `@beads/bd` in `package.json`, or the in-container `bd` and the host `bd` can disagree about the database format.
- To bump either: change `compose.yaml` (build args and image tag), the Dockerfile defaults, and `@beads/bd` together, then `docker compose build --no-cache scotty` and `bun run scotty:up`.
- The build needs network access (a `git clone` and the `bd` release archive from GitHub).

## Quick diagnosis

| Symptom | Cause and fix |
| --- | --- |
| `short-name ... did not resolve` while building | An image in the Dockerfile lacks the `docker.io/` prefix. |
| `docker: command not found` | Install Docker, or `podman-docker` on Arch. |
| `permission denied` on `/data/.beads/embeddeddolt` | `SCOTTY_USER` (see above). Rootless Podman: `0:0`. |
| Board shows `0 beads` | Empty or diverged local DB (see above). |
| `scotty:up` stops before starting | The pull failed. Read the error, fix the remote or network, run `bun run beads:latest`. |
| Settings do not persist or cannot be written | Root-owned old volume: `docker compose down -v`, then `scotty:up`. |
| Port 3000 busy | `SCOTTY_PORT=3001 bun run scotty:up`. |
| Shows Demo instead of this project | Select the `/data` project in the UI. |
