/** Guards the git-driving script tests against the GIT_* variables a git hook exports. */
import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cleanEnv = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(Bun.env).filter(([name]) => !name.startsWith("GIT_")),
  ) as Record<string, string>;

describe("script tests that drive git", () => {
  const decoy = mkdtempSync(join(tmpdir(), "hook-env-decoy-"));
  const git = (...args: ReadonlyArray<string>) =>
    Bun.spawnSync(["git", ...args], {
      cwd: decoy,
      env: cleanEnv(),
      stdout: "pipe",
      stderr: "pipe",
    });

  describe("when run the way a pre-commit hook runs them", () => {
    it("leave the committing repository alone", () => {
      git("init", "--quiet", "--initial-branch=main");
      const before = git("rev-parse", "--verify", "--quiet", "HEAD").exitCode;
      for (const file of ["install-git-hooks.test.ts", "check-commit-subject.test.ts"]) {
        Bun.spawnSync(["bun", "test", join(import.meta.dir, file)], {
          cwd: decoy,
          env: {
            ...cleanEnv(),
            GIT_DIR: join(decoy, ".git"),
            GIT_INDEX_FILE: join(decoy, ".git", "index"),
          },
          stdout: "pipe",
          stderr: "pipe",
        });
      }
      expect(git("config", "--local", "--get", "core.hooksPath").exitCode).not.toBe(0);
      expect(git("config", "--local", "--get", "core.bare").stdout.toString().trim()).toBe("false");
      expect(git("rev-parse", "--verify", "--quiet", "HEAD").exitCode).toBe(before);
      expect(git("branch", "--list").stdout.toString().trim()).toBe("");
      rmSync(decoy, { recursive: true, force: true });
    });
  });
});
