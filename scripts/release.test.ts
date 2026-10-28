/** `bun run release:*`: bumps the version, tags it, and pushes both, or changes nothing. */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  nextVersion,
  release,
  ReleaseError,
  repositoryOf,
  type Bump,
  type ReleaseOptions,
} from "./release.ts";

// Real repositories in a temporary directory, away from the machine's git configuration and hooks.
const env = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
  GIT_AUTHOR_NAME: "Test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "Test",
  GIT_COMMITTER_EMAIL: "test@example.com",
  GIT_DIR: undefined,
  GIT_INDEX_FILE: undefined,
  GIT_WORK_TREE: undefined,
  GIT_PREFIX: undefined,
  GIT_COMMON_DIR: undefined,
};

const git = (directory: string, ...args: ReadonlyArray<string>): string => {
  const result = Bun.spawnSync(["git", ...args], {
    cwd: directory,
    env,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr.toString()}`);
  return result.stdout.toString().trim();
};

describe("release", () => {
  let root = "";
  let origin = "";
  let work = "";

  const options = (bump: Bump, extra: Partial<ReleaseOptions> = {}): ReleaseOptions => ({
    bump,
    directory: work,
    branch: "master",
    env,
    ...extra,
  });

  const readVersion = async (): Promise<string> =>
    (JSON.parse(await Bun.file(join(work, "package.json")).text()) as { version: string }).version;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "release-"));
    origin = join(root, "origin.git");
    work = join(root, "work");
    git(root, "init", "--bare", "--initial-branch=master", origin);
    git(root, "clone", "--quiet", origin, work);
    git(work, "switch", "--create", "master");
    writeFileSync(
      join(work, "package.json"),
      `${JSON.stringify({ name: "site", version: "3.0.0" }, null, 2)}\n`,
    );
    writeFileSync(join(work, ".gitignore"), "node_modules\n");
    git(work, "add", "-A");
    git(work, "commit", "--quiet", "-m", "chore: start");
    git(work, "push", "--quiet", "--set-upstream", "origin", "master");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  describe("nextVersion", () => {
    it.each([
      ["3.0.0", "patch", "3.0.1"],
      ["3.0.0", "minor", "3.1.0"],
      ["3.0.0", "major", "4.0.0"],
      ["2.2.6", "major", "3.0.0"],
      ["1.4.9", "minor", "1.5.0"],
      ["1.9.9", "minor", "1.10.0"],
      ["0.0.9", "patch", "0.0.10"],
      ["1.2.3", "major", "2.0.0"],
    ] as const)("%s %s is %s", (current, bump, expected) => {
      expect(nextVersion(current, bump)).toBe(expected);
    });

    it.each(["3.0.0-rc.1", "3.0", "3", "v3.0.0", "3.0.0+build", "", "three"])(
      "refuses %j, which is not a plain X.Y.Z version",
      (current) => {
        expect(() => nextVersion(current, "patch")).toThrow(
          "a release needs a plain X.Y.Z version",
        );
      },
    );
  });

  describe("a release", () => {
    it.each([
      ["patch", "3.0.1"],
      ["minor", "3.1.0"],
      ["major", "4.0.0"],
    ] as const)("%s bumps 3.0.0 to %s", async (bump, expected) => {
      const result = await release(options(bump));
      expect(result).toMatchObject({
        version: expected,
        tag: `v${expected}`,
        branch: "master",
        dryRun: false,
      });
      expect(await readVersion()).toBe(expected);
    });

    it("commits the bump with a conventional message, changing nothing but the version", async () => {
      await release(options("minor"));
      expect(git(work, "log", "-1", "--format=%s")).toBe("chore(release): v3.1.0");
      expect(git(work, "show", "--format=", "--stat", "HEAD")).toContain("package.json | 2 +-");
      expect(git(work, "status", "--porcelain")).toBe("");
    });

    it("tags that commit with an annotated tag", async () => {
      await release(options("patch"));
      expect(git(work, "cat-file", "-t", "v3.0.1")).toBe("tag");
      expect(git(work, "rev-list", "-n", "1", "v3.0.1")).toBe(git(work, "rev-parse", "HEAD"));
    });

    it("pushes the branch and the tag to the remote", async () => {
      await release(options("patch"));
      expect(git(origin, "rev-parse", "master")).toBe(git(work, "rev-parse", "HEAD"));
      expect(git(origin, "tag", "--list")).toBe("v3.0.1");
      expect(git(origin, "rev-list", "-n", "1", "v3.0.1")).toBe(git(work, "rev-parse", "HEAD"));
    });

    it("can be followed by another one", async () => {
      await release(options("patch"));
      await release(options("minor"));
      expect(git(origin, "tag", "--list")).toBe("v3.0.1\nv3.1.0");
      expect(await readVersion()).toBe("3.1.0");
    });
  });

  describe("a dry run", () => {
    it("says which version it would release and changes nothing", async () => {
      const before = git(work, "rev-parse", "HEAD");
      const result = await release(options("major", { dryRun: true }));
      expect(result).toMatchObject({ version: "4.0.0", tag: "v4.0.0", dryRun: true });
      expect(git(work, "rev-parse", "HEAD")).toBe(before);
      expect(git(work, "tag", "--list")).toBe("");
      expect(git(origin, "tag", "--list")).toBe("");
      expect(await readVersion()).toBe("3.0.0");
    });

    it("still refuses what a real release would refuse", async () => {
      writeFileSync(join(work, "stray.txt"), "x");
      await expect(release(options("patch", { dryRun: true }))).rejects.toThrow(
        "uncommitted changes",
      );
    });
  });

  describe("refuses", () => {
    it("a bump that is not patch, minor or major", async () => {
      await expect(release(options("prerelease" as Bump))).rejects.toThrow(
        "must be one of patch, minor, major",
      );
    });

    it("a working tree with uncommitted changes", async () => {
      writeFileSync(join(work, "package.json"), "{ }\n");
      await expect(release(options("patch"))).rejects.toThrow(
        "The working tree has uncommitted changes",
      );
    });

    it("a file that git does not track yet", async () => {
      writeFileSync(join(work, "new.txt"), "x");
      await expect(release(options("patch"))).rejects.toThrow("uncommitted changes");
    });

    it("another branch than the release branch", async () => {
      git(work, "switch", "--create", "feature");
      await expect(release(options("patch"))).rejects.toThrow(
        'Releases are made from "master", but this is "feature"',
      );
    });

    it("a branch that is behind the remote", async () => {
      const other = join(root, "other");
      git(root, "clone", "--quiet", origin, other);
      writeFileSync(join(other, "new.txt"), "x");
      git(other, "add", "-A");
      git(other, "commit", "--quiet", "-m", "chore: more");
      git(other, "push", "--quiet", "origin", "master");
      await expect(release(options("patch"))).rejects.toThrow(
        "1 commit(s) behind origin/master. Pull first",
      );
    });

    it("a branch with commits the remote does not have", async () => {
      writeFileSync(join(work, "new.txt"), "x");
      git(work, "add", "-A");
      git(work, "commit", "--quiet", "-m", "chore: local");
      await expect(release(options("patch"))).rejects.toThrow("1 commit(s) ahead of origin/master");
    });

    it("a version in package.json that is not a plain X.Y.Z, without changing anything", async () => {
      writeFileSync(
        join(work, "package.json"),
        `${JSON.stringify({ name: "site", version: "3.0.0-rc.1" })}\n`,
      );
      git(work, "commit", "--quiet", "--all", "-m", "chore: rc");
      git(work, "push", "--quiet", "origin", "master");
      const before = git(work, "rev-parse", "HEAD");
      await expect(release(options("patch"))).rejects.toThrow(
        "a release needs a plain X.Y.Z version",
      );
      expect(git(work, "rev-parse", "HEAD")).toBe(before);
      expect(git(work, "tag", "--list")).toBe("");
    });

    it("a tag that exists here", async () => {
      git(work, "tag", "v3.0.1");
      await expect(release(options("patch"))).rejects.toThrow("The tag v3.0.1 exists already here");
    });

    it("a tag that exists on the remote", async () => {
      const other = join(root, "other");
      git(root, "clone", "--quiet", origin, other);
      git(other, "tag", "v3.0.1");
      git(other, "push", "--quiet", "origin", "v3.0.1");
      // The tag is fetched with the branch, so it is found as one that exists already.
      await expect(release(options("patch"))).rejects.toThrow("tag v3.0.1 exists already");
    });

    it("leaves the repository as it was, whichever of these it is", async () => {
      git(work, "switch", "--create", "feature");
      const before = git(work, "rev-parse", "HEAD");
      await expect(release(options("patch"))).rejects.toBeInstanceOf(ReleaseError);
      expect(git(work, "rev-parse", "HEAD")).toBe(before);
      expect(await readVersion()).toBe("3.0.0");
    });
  });

  describe("when something fails", () => {
    it("puts the repository back if a git hook refuses the version commit", async () => {
      const hook = join(work, ".git", "hooks", "pre-commit");
      writeFileSync(hook, "#!/bin/sh\necho 'verify failed' >&2\nexit 1\n");
      chmodSync(hook, 0o755);
      const before = git(work, "rev-parse", "HEAD");
      await expect(release(options("patch"))).rejects.toThrow(
        "Could not bump the version, nothing was changed",
      );
      expect(git(work, "rev-parse", "HEAD")).toBe(before);
      expect(git(work, "tag", "--list")).toBe("");
      expect(git(work, "status", "--porcelain")).toBe("");
      expect(await readVersion()).toBe("3.0.0");
    });

    it("undoes the release if the remote refuses the push, and publishes nothing", async () => {
      const hook = join(origin, "hooks", "pre-receive");
      writeFileSync(hook, "#!/bin/sh\necho 'protected branch' >&2\nexit 1\n");
      chmodSync(hook, 0o755);
      const before = git(work, "rev-parse", "HEAD");
      await expect(release(options("patch"))).rejects.toThrow("The push to origin was refused");
      expect(git(work, "rev-parse", "HEAD")).toBe(before);
      expect(git(work, "tag", "--list")).toBe("");
      expect(git(work, "status", "--porcelain")).toBe("");
      expect(await readVersion()).toBe("3.0.0");
      expect(git(origin, "tag", "--list")).toBe("");
      expect(git(origin, "rev-parse", "master")).toBe(before);
    });

    it("pushes both the branch and the tag or neither", async () => {
      const hook = join(origin, "hooks", "pre-receive");
      // Lets the branch through and refuses the tag.
      writeFileSync(
        hook,
        '#!/bin/sh\nwhile read old new ref; do case "$ref" in refs/tags/*) exit 1;; esac; done\n',
      );
      chmodSync(hook, 0o755);
      const before = git(work, "rev-parse", "HEAD");
      await expect(release(options("patch"))).rejects.toThrow("refused");
      expect(git(origin, "rev-parse", "master")).toBe(before);
    });
  });

  describe("repositoryOf", () => {
    it.each([
      ["https://github.com/williamrjribeiro/resume", "williamrjribeiro/resume"],
      ["https://github.com/williamrjribeiro/resume.git", "williamrjribeiro/resume"],
      ["git@github.com:williamrjribeiro/resume.git", "williamrjribeiro/resume"],
      ["https://github.com/williamrjribeiro/resume/", "williamrjribeiro/resume"],
    ])("reads %s", (url, expected) => {
      expect(repositoryOf(url)).toBe(expected);
    });

    it("finds nothing in an address that is not on GitHub", () => {
      expect(repositoryOf("https://example.com/a/b.git")).toBeUndefined();
    });
  });
});
