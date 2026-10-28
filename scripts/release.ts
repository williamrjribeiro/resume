/**
 * `bun run release:patch`, `release:minor` or `release:major`: releases a new version of the site.
 *
 * It bumps `version` in package.json, commits that as `chore(release): vX.Y.Z`, tags the commit `vX.Y.Z`
 * (an annotated tag) and pushes the branch and the tag together. The tag push starts the Deploy workflow
 * (.github/workflows/deploy.yml), which verifies the commit again, builds the site, publishes it to GitHub
 * Pages and creates the GitHub Release. The commit and tag are made here, not by a workflow, because a tag
 * pushed with a workflow's own token does not start other workflows.
 *
 *   bun run release:patch              1.2.3 → 1.2.4
 *   bun run release:minor              1.2.3 → 1.3.0
 *   bun run release:major              1.2.3 → 2.0.0
 *   bun scripts/release.ts patch --dry-run   checks everything and says what it would do
 *
 * It refuses to run unless it can release exactly what is on the remote branch: on that branch, with a
 * clean tree, in sync with the remote, and without a tag of that name there. If the bump or the push
 * fails, it puts the repository back as it was. The commit goes through the git hooks like any other.
 */

export const BUMPS = ["patch", "minor", "major"] as const;
export type Bump = (typeof BUMPS)[number];

/** A problem that stops the release, with a message for the person running it. */
export class ReleaseError extends Error {}

export type ReleaseOptions = {
  readonly bump: Bump;
  /** The repository to release from. */
  readonly directory: string;
  readonly remote?: string;
  /** The branch releases are made from. Defaults to the remote's default branch, or `master`. */
  readonly branch?: string;
  /** Check everything and report the version, but change nothing. */
  readonly dryRun?: boolean;
  /** The environment of the commands that are run. Defaults to this process's. */
  readonly env?: Readonly<Record<string, string | undefined>>;
};

export type ReleaseResult = {
  readonly version: string;
  readonly tag: string;
  readonly branch: string;
  readonly remote: string;
  readonly dryRun: boolean;
};

type Output = { readonly code: number; readonly stdout: string; readonly stderr: string };

const isBump = (value: string | undefined): value is Bump => BUMPS.some((bump) => bump === value);

/** `https://github.com/owner/repo.git` or `git@github.com:owner/repo.git` → `owner/repo` */
export const repositoryOf = (remoteUrl: string): string | undefined =>
  /github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?\/?$/.exec(remoteUrl.trim())?.[1];

export const release = async ({
  bump,
  directory,
  remote = "origin",
  branch: requestedBranch,
  dryRun = false,
  env = process.env,
}: ReleaseOptions): Promise<ReleaseResult> => {
  if (!isBump(bump)) {
    throw new ReleaseError(`The bump must be one of ${BUMPS.join(", ")}, got "${String(bump)}".`);
  }

  const run = async (command: ReadonlyArray<string>): Promise<Output> => {
    const child = Bun.spawn([...command], {
      cwd: directory,
      env: { ...env, GIT_TERMINAL_PROMPT: "0" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { code, stdout: stdout.trim(), stderr: stderr.trim() };
  };
  const git = (...args: ReadonlyArray<string>) => run(["git", ...args]);
  const bun = (...args: ReadonlyArray<string>) => run([process.execPath, ...args]);

  if ((await git("rev-parse", "--is-inside-work-tree")).stdout !== "true") {
    throw new ReleaseError(`${directory} is not a git repository.`);
  }

  const detected = (
    await git("symbolic-ref", "--short", `refs/remotes/${remote}/HEAD`)
  ).stdout.replace(`${remote}/`, "");
  const releaseBranch = requestedBranch ?? (detected === "" ? "master" : detected);

  const current = (await git("branch", "--show-current")).stdout;
  if (current !== releaseBranch) {
    throw new ReleaseError(
      `Releases are made from "${releaseBranch}", but this is "${current || "a detached HEAD"}". Switch with: git switch ${releaseBranch}`,
    );
  }
  if ((await git("status", "--porcelain")).stdout !== "") {
    throw new ReleaseError("The working tree has uncommitted changes. Commit or stash them first.");
  }

  const fetched = await git("fetch", "--tags", "--quiet", remote, releaseBranch);
  if (fetched.code !== 0) {
    throw new ReleaseError(`Could not fetch ${remote}/${releaseBranch}:\n${fetched.stderr}`);
  }
  const [behind, ahead] = (
    await git("rev-list", "--left-right", "--count", `${remote}/${releaseBranch}...HEAD`)
  ).stdout
    .split(/\s+/)
    .map(Number);
  if ((behind ?? 0) > 0) {
    throw new ReleaseError(
      `${releaseBranch} is ${behind} commit(s) behind ${remote}/${releaseBranch}. Pull first: git pull`,
    );
  }
  if ((ahead ?? 0) > 0) {
    throw new ReleaseError(
      `${releaseBranch} is ${ahead} commit(s) ahead of ${remote}/${releaseBranch}. A release publishes what is on the remote, which CI has checked: push those commits (through a pull request, if the branch needs one) and run this again.`,
    );
  }

  const planned = await bun("pm", "version", bump, "--dry-run");
  const version = /(\d+\.\d+\.\d+[^\s]*)\s*$/.exec(planned.stdout)?.[1];
  if (planned.code !== 0 || version === undefined) {
    throw new ReleaseError(
      `Could not work out the next version:\n${planned.stderr || planned.stdout}`,
    );
  }
  const tag = `v${version}`;

  if ((await git("tag", "--list", tag)).stdout !== "") {
    throw new ReleaseError(`The tag ${tag} exists already here.`);
  }
  const onRemote = await git("ls-remote", "--tags", remote, `refs/tags/${tag}`);
  if (onRemote.stdout !== "") {
    throw new ReleaseError(`The tag ${tag} exists already on ${remote}.`);
  }

  const result: ReleaseResult = { version, tag, branch: releaseBranch, remote, dryRun };
  if (dryRun) return result;

  const before = (await git("rev-parse", "HEAD")).stdout;
  /** Puts the repository back as it was: the tree was clean, so nothing but the release is lost. */
  const rollback = async (): Promise<void> => {
    await git("tag", "--delete", tag);
    await git("reset", "--hard", before);
  };

  const bumped = await bun("pm", "version", bump, "--message", "chore(release): v%s");
  if (bumped.code !== 0) {
    await rollback();
    throw new ReleaseError(
      `Could not bump the version, nothing was changed:\n${bumped.stderr || bumped.stdout}`,
    );
  }

  const pushed = await git(
    "push",
    "--atomic",
    remote,
    `refs/heads/${releaseBranch}:refs/heads/${releaseBranch}`,
    `refs/tags/${tag}:refs/tags/${tag}`,
  );
  if (pushed.code !== 0) {
    await rollback();
    throw new ReleaseError(
      `The push to ${remote} was refused, so the release was undone here and nothing was published:\n${pushed.stderr}`,
    );
  }
  return result;
};

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const bump = args.find((arg) => !arg.startsWith("--"));
  const directory = Bun.fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

  try {
    if (!isBump(bump)) {
      throw new ReleaseError(`Usage: bun run release:<${BUMPS.join("|")}> [--dry-run]`);
    }
    const result = await release({ bump, directory, dryRun });
    if (result.dryRun) {
      console.log(
        `Dry run: would release ${result.tag} from ${result.branch}. Nothing was changed.`,
      );
    } else {
      const url = (
        await Bun.$`git remote get-url ${result.remote}`.cwd(directory).quiet().text()
      ).trim();
      const repository = repositoryOf(url);
      console.log(
        `Released ${result.tag}: pushed ${result.branch} and the tag to ${result.remote}.`,
      );
      if (repository !== undefined) {
        console.log(`The Deploy workflow is running: https://github.com/${repository}/actions`);
      }
    }
  } catch (error) {
    console.error(error instanceof ReleaseError ? error.message : error);
    process.exit(1);
  }
}
