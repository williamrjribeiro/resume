---
name: beads
description: Use when working in a repository that uses bd or Beads for durable project task tracking, issue dependencies, blocker management, multi-session handoff, or shared work memory. Trigger when the user asks to find ready work, claim or close tasks, create follow-up work, inspect blockers, recover project context, sync beads data, recover from an empty local database, or choose between local planning and persistent project tracking.
---

# Beads

Use Beads as the shared project task system. Local plans, scratch files, and personal memories are useful, but they are not the durable source of truth for project work.

Repo tooling/layout: `repo-conventions`. Tests: `bdd-bun-test`.

## First Step

Pull latest remote beads data, then prime:

```bash
bun run beads:latest
bd prime
```

If `bd prime` prints nothing, check whether the repository has an active Beads workspace:

```bash
bd where
```

## Preferred Route

Use the `bd` CLI when shell access is available. It is the most compact and direct Beads interface. Prefer project Bun scripts for Dolt sync:

```bash
bun run beads:latest   # bd dolt pull — before reading or changing issues
bun run beads:push     # bd dolt push — after create / update / close / dep
```

`bun run scotty:up` runs `beads:latest` before starting the Scotty UI (skill `scotty`).

## Core CLI Workflow

1. Find work:

```bash
bd ready
bd list --status=open
bd list --status=in_progress
```

2. Inspect before editing:

```bash
bd show <id>
```

3. Claim work atomically:

```bash
bd update <id> --claim
```

4. Create durable follow-up work when implementation reveals new tasks:

```bash
bd create "Short title" --description="Why this exists and what needs to be done" --type=task --priority=2
```

5. Close completed work:

```bash
bd close <id> --reason="Completed"
```

6. Sync after mutations (when the user or active profile authorizes remote sync):

```bash
bun run beads:push
```

## What Belongs In Beads

Use Beads for:

- shared project tasks
- blockers and dependencies
- discovered follow-up work
- work that must survive thread reset, compaction, or handoff
- status that another person or agent should be able to resume

Use agent-local planning tools only for the current turn's execution checklist. Do not treat them as shared project state.

## Sync Rules

- Pull (`bun run beads:latest`) at session start and before Scotty or any bulk `bd list` / `bd ready`
- Push (`bun run beads:push`) after every create / update / close / dependency change when sync is authorized
- Do not treat `.beads/issues.jsonl` as the sync source of truth — Dolt at `refs/dolt/data` is
- Do not force-push an empty local database over Origin

## Troubleshooting: empty local DB

If `bd stats` reports Total Issues `0` while the team expects work, or the Beads UI shows `0 beads`: check `git ls-remote origin refs/dolt/data`, try `bun run beads:latest`, and follow the recovery steps in the `scotty` skill ("Empty board"). Never `bd dolt push --force` from an empty local DB.

For the Beads UI, Docker or Podman, and `SCOTTY_USER` permission errors, use the `scotty` skill.

## Issue types and priorities

- Types: `bug`, `feature`, `task` (tests, docs, refactoring), `epic` (large feature with subtasks), `chore` (maintenance, dependencies, tooling).
- Priorities: `0` critical (security, data loss, broken builds), `1` high, `2` medium (default), `3` low (polish), `4` backlog.

Create issues with a real description. Add `--acceptance` and `--design` fields, and check completeness with `--validate`. Link discovered work to its source: `bd create "Found bug" --description="Details" -p 1 --deps discovered-from:<parent-id>`.

Lifecycle and hygiene: `bd defer <id>`, `bd supersede <id>`, `bd stale`, `bd orphans`, `bd lint`, `bd human <id>` (flag for a human decision), `bd formula list` and `bd mol pour <name>` (structured workflows). Use `bd remember` for persistent knowledge instead of ad hoc memory files.

## Agent context profiles

This guidance does not override repository, user, or orchestrator instructions.

- **Conservative (default):** use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal:** keep tool instruction files as pointers to `bd prime`; same conservative git policy.
- **Team-maintainer:** only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session completion

When ending a Beads implementation workflow:

1. File issues for remaining work.
2. Run quality gates if code changed (`bun run verify`).
3. Update issue status: close finished work, update in-progress items.
4. Handle git and sync by the active profile. Conservative: run `git status` and propose commands, then wait for approval. Team-maintainer: `git pull --rebase`, `bun run beads:push`, `git push`, `git status`.
5. Hand off: summarize changes, validation, issue status, and any blocked sync, commit or push step.

If a required sync or push is blocked, stop and report the exact command and error. Never commit or push without clear authority from the active profile or the current request.

## Rules

- Do not create markdown TODO files or use agent-local task tools (TodoWrite, TaskCreate) as the source of truth when Beads is available.
- Do not use `bd edit`; it opens an interactive editor. Use `bd update` flags instead.
- Prefer `--json` when parsing `bd` output programmatically.
- If hooks are installed, `bd prime` may already be injected. Run it manually when context is missing.
- Do not auto-close or mutate tasks unless the work is actually complete.
