/** Lefthook install after `bun install`: skip CI, chain Cursor agent-hooks. */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installGitHooks, type SpawnResult, withoutGitEnv } from "./install-git-hooks.ts";

describe("install-git-hooks", () => {
  const lefthookYml = join(import.meta.dir, "..", "lefthook.yml");
  const lefthookHook = (repo: string, name: "pre-commit" | "commit-msg"): string =>
    join(repo, ".git", "hooks", name);
  const hasLefthookHook = (repo: string, name: "pre-commit" | "commit-msg"): boolean => {
    const file = lefthookHook(repo, name);
    return existsSync(file) && readFileSync(file, "utf8").includes("lefthook");
  };
  const git = (repo: string, args: ReadonlyArray<string>): SpawnResult => {
    const result = Bun.spawnSync(["git", ...args], {
      cwd: repo,
      env: withoutGitEnv(),
      stdout: "pipe",
      stderr: "pipe",
    });
    return {
      exitCode: result.exitCode,
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
    };
  };
  const failedLefthook = (): SpawnResult => ({
    exitCode: 1,
    stdout: "",
    stderr: "lefthook exploded",
  });

  describe("when CI=true", () => {
    let repo = "";

    beforeAll(() => {
      repo = mkdtempSync(join(tmpdir(), "install-hooks-ci-"));
      git(repo, ["init", "--quiet", "--initial-branch=main"]);
      writeFileSync(join(repo, "lefthook.yml"), readFileSync(lefthookYml));
    });

    afterAll(() => {
      rmSync(repo, { recursive: true, force: true });
    });

    it("skips lefthook install and still succeeds", () => {
      const lefthookCalls: Array<ReadonlyArray<string>> = [];
      const code = installGitHooks({
        root: repo,
        env: { CI: "true" },
        lefthookInstall: (args) => {
          lefthookCalls.push(args);
          return failedLefthook();
        },
      });
      expect(code).toBe(0);
      expect(lefthookCalls).toEqual([]);
      expect(existsSync(lefthookHook(repo, "pre-commit"))).toBe(false);
    });
  });

  describe("when there is no .git directory", () => {
    let directory = "";

    beforeAll(() => {
      directory = mkdtempSync(join(tmpdir(), "install-hooks-nogit-"));
    });

    afterAll(() => {
      rmSync(directory, { recursive: true, force: true });
    });

    it("skips lefthook install and still succeeds", () => {
      const lefthookCalls: Array<ReadonlyArray<string>> = [];
      const code = installGitHooks({
        root: directory,
        env: {},
        lefthookInstall: (args) => {
          lefthookCalls.push(args);
          return failedLefthook();
        },
      });
      expect(code).toBe(0);
      expect(lefthookCalls).toEqual([]);
    });
  });

  describe("in a normal local clone", () => {
    let repo = "";

    beforeAll(() => {
      repo = mkdtempSync(join(tmpdir(), "install-hooks-local-"));
      git(repo, ["init", "--quiet", "--initial-branch=main"]);
      writeFileSync(join(repo, "lefthook.yml"), readFileSync(lefthookYml));
    });

    afterAll(() => {
      rmSync(repo, { recursive: true, force: true });
    });

    it("installs lefthook into .git/hooks without --force or --reset-hooks-path", () => {
      const code = installGitHooks({ root: repo, env: {} });
      expect(code).toBe(0);
      expect(hasLefthookHook(repo, "pre-commit")).toBe(true);
      expect(hasLefthookHook(repo, "commit-msg")).toBe(true);
      expect(git(repo, ["config", "--local", "--get", "core.hooksPath"]).exitCode).not.toBe(0);
    });
  });

  describe("when lefthook install fails", () => {
    let repo = "";

    beforeAll(() => {
      repo = mkdtempSync(join(tmpdir(), "install-hooks-fail-"));
      git(repo, ["init", "--quiet", "--initial-branch=main"]);
      writeFileSync(join(repo, "lefthook.yml"), readFileSync(lefthookYml));
    });

    afterAll(() => {
      rmSync(repo, { recursive: true, force: true });
    });

    it("warns and still succeeds so bun install does not fail", () => {
      const warnings: Array<string> = [];
      const code = installGitHooks({
        root: repo,
        env: {},
        lefthookInstall: () => failedLefthook(),
        warn: (message) => {
          warnings.push(message);
        },
      });
      expect(code).toBe(0);
      expect(warnings.join("\n")).toContain("lefthook exploded");
    });
  });

  describe("when core.hooksPath is a Cursor agent-hooks directory", () => {
    let repo = "";
    let agentHooks = "";

    beforeAll(() => {
      repo = mkdtempSync(join(tmpdir(), "install-hooks-cursor-"));
      agentHooks = mkdtempSync(join(tmpdir(), "cursor-agent-hooks-"));
      git(repo, ["init", "--quiet", "--initial-branch=main"]);
      writeFileSync(join(repo, "lefthook.yml"), readFileSync(lefthookYml));
      const nested = join(agentHooks, ".cursor", "agent-hooks", "testid");
      mkdirSync(nested, { recursive: true });
      agentHooks = nested;
      writeFileSync(join(agentHooks, ".dispatcher"), "#!/bin/bash\n# @cursor-managed\n");
      Bun.spawnSync(["chmod", "+x", join(agentHooks, ".dispatcher")]);
      Bun.spawnSync(["ln", "-s", ".dispatcher", join(agentHooks, "pre-commit")]);
      writeFileSync(join(agentHooks, "commit-msg"), "not a dispatcher symlink\n");
      writeFileSync(join(agentHooks, ".cursor-original-hooks-path"), "/wrong/path\n");
      git(repo, ["config", "--local", "core.hooksPath", agentHooks]);
    });

    afterAll(() => {
      rmSync(repo, { recursive: true, force: true });
      rmSync(join(agentHooks, "..", "..", ".."), { recursive: true, force: true });
    });

    it("installs lefthook into .git/hooks, restores Cursor hooksPath, and chains the dispatcher", () => {
      const lefthookArgs: Array<ReadonlyArray<string>> = [];
      const code = installGitHooks({
        root: repo,
        env: {},
        lefthookInstall: (args) => {
          lefthookArgs.push(args);
          const lefthook = join(import.meta.dir, "..", "node_modules", ".bin", "lefthook");
          const result = Bun.spawnSync([lefthook, ...args], {
            cwd: repo,
            env: withoutGitEnv(),
            stdout: "pipe",
            stderr: "pipe",
          });
          return {
            exitCode: result.exitCode,
            stdout: result.stdout.toString(),
            stderr: result.stderr.toString(),
          };
        },
      });
      expect(code).toBe(0);
      expect(lefthookArgs).toEqual([["install"]]);
      expect(hasLefthookHook(repo, "pre-commit")).toBe(true);
      expect(hasLefthookHook(repo, "commit-msg")).toBe(true);
      expect(git(repo, ["config", "--local", "--get", "core.hooksPath"]).stdout.trim()).toBe(
        agentHooks,
      );
      const original = readFileSync(join(agentHooks, ".cursor-original-hooks-path"), "utf8").trim();
      expect(original).toBe(join(repo, ".git", "hooks"));
      expect(readlinkSync(join(agentHooks, "pre-commit"))).toBe(".dispatcher");
      expect(readlinkSync(join(agentHooks, "commit-msg"))).toBe(".dispatcher");
    });
  });

  describe("when core.hooksPath is some other custom path", () => {
    let repo = "";
    let customHooks = "";

    beforeAll(() => {
      repo = mkdtempSync(join(tmpdir(), "install-hooks-custom-"));
      customHooks = mkdtempSync(join(tmpdir(), "custom-hooks-"));
      git(repo, ["init", "--quiet", "--initial-branch=main"]);
      writeFileSync(join(repo, "lefthook.yml"), readFileSync(lefthookYml));
      git(repo, ["config", "--local", "core.hooksPath", customHooks]);
    });

    afterAll(() => {
      rmSync(repo, { recursive: true, force: true });
      rmSync(customHooks, { recursive: true, force: true });
    });

    it("does not lefthook --force into that path, and still succeeds", () => {
      const lefthookCalls: Array<ReadonlyArray<string>> = [];
      const warnings: Array<string> = [];
      const code = installGitHooks({
        root: repo,
        env: {},
        lefthookInstall: (args) => {
          lefthookCalls.push(args);
          return failedLefthook();
        },
        warn: (message) => {
          warnings.push(message);
        },
      });
      expect(code).toBe(0);
      expect(lefthookCalls).toEqual([]);
      expect(warnings.join("\n")).toContain("core.hooksPath");
      expect(git(repo, ["config", "--local", "--get", "core.hooksPath"]).stdout.trim()).toBe(
        customHooks,
      );
      expect(existsSync(join(customHooks, "pre-commit"))).toBe(false);
    });
  });
});
