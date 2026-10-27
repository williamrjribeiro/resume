# syntax=docker/dockerfile:1
# Bead Me Up, Scotty (Beads UI), built and run with Bun only: no Node.js in any stage.
# Builds from the pinned upstream tag — this app is private and not on npm.
# Upstream: https://github.com/brendan-appstart/bead-me-up-scotty/tree/v0.3.0
# Stages follow that release's Dockerfile, with Bun in place of Node: `bun install` reads
# the upstream package-lock.json, `bun --bun` runs Next.js on Bun, and `bun server.js`
# serves the standalone output. Source is cloned instead of COPY from context.
#
# Bundled `bd` defaults to 1.3.1 to match this repo's @beads/bd. Override:
#   docker compose build --build-arg BD_VERSION=1.3.1 scotty
#
# Dolt remotes / `bd dolt push|pull` are host-side (the image has no git).

ARG SCOTTY_VERSION=v0.3.0
ARG BD_VERSION=1.3.1
ARG BUN_VERSION=1.4.4

FROM alpine:3.22 AS src
ARG SCOTTY_VERSION
RUN apk add --no-cache git \
 && git clone --depth 1 --branch "${SCOTTY_VERSION}" \
      https://github.com/brendan-appstart/bead-me-up-scotty.git /src

# bd uses embedded Dolt (CGO); the prebuilt Linux binary is glibc-linked, so the
# runner is Debian-based (oven/bun default image), not Alpine. Images use docker.io/ so
# rootless Podman resolves them without a short-name registry config.
FROM alpine:3.22 AS bd
ARG BD_VERSION
ARG TARGETARCH
ADD https://github.com/gastownhall/beads/releases/download/v${BD_VERSION}/beads_${BD_VERSION}_linux_${TARGETARCH}.tar.gz /tmp/bd.tar.gz
RUN tar -xzf /tmp/bd.tar.gz -C /tmp && mv /tmp/bd /usr/local/bin/bd

# Eleventy for the showcase publisher: the app finds node_modules/@11ty/eleventy/cmd.cjs by
# scanning the filesystem and runs it with its own runtime (Bun), so install it with its
# full dependency tree here and copy it into the runner. Keep the version in sync with
# Scotty's package.json.
FROM docker.io/oven/bun:${BUN_VERSION} AS eleventy
WORKDIR /eleventy
RUN bun add --no-save @11ty/eleventy@3.1.6

FROM docker.io/oven/bun:${BUN_VERSION} AS builder
WORKDIR /app
COPY --from=src /src/package.json /src/package-lock.json ./
RUN bun install --frozen-lockfile
COPY --from=src /src .
ARG BUILD_NUMBER=""
ARG BUILD_SHA=""
ENV NEXT_STANDALONE=1
# `--bun` makes Next.js and its `node` shebangs run on Bun.
RUN bun --bun run build

FROM docker.io/oven/bun:${BUN_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV HOME=/home/nextjs
ENV XDG_CONFIG_HOME=/home/nextjs/.config

# Nested config path must exist before USER. Compose mounts scotty-config at
# /home/nextjs/.config/bead-me-up-scotty; if the dir is missing, Docker creates
# it root:root 0755 and user 1001 / host SCOTTY_USER cannot write config.json.
# 0777 keeps default 1001:1001, Docker Desktop host uid, and rootless 0:0 writable.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --create-home --home-dir /home/nextjs nextjs \
 && mkdir -p /home/nextjs/.config/bead-me-up-scotty \
 && chown -R nextjs:nodejs /home/nextjs \
 && chmod 0777 /home/nextjs /home/nextjs/.config /home/nextjs/.config/bead-me-up-scotty

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
RUN rm -rf ./node_modules/@11ty
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=bd --chown=nextjs:nodejs /usr/local/bin/bd /usr/local/bin/bd
COPY --from=eleventy --chown=nextjs:nodejs /eleventy/node_modules /node_modules

USER nextjs
EXPOSE 3000
CMD ["bun", "server.js"]
