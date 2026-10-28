/** The commit subject rule that the commit-msg hook and CI both apply. */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isConventionalSubject } from "./check-commit-subject.ts";

describe("check-commit-subject", () => {
  describe("isConventionalSubject", () => {
    it.each([
      "feat: add a parser",
      "fix(api): put Bm over couldn't",
      "docs(api)!: rename the context",
      "chore: leave the lockfile to bun",
      "Merge branch 'main' into feat/api",
      'Revert "feat: add a parser"',
      "fixup! feat: add a parser",
    ])("accepts %s", (subject) => {
      expect(isConventionalSubject(subject)).toBe(true);
    });

    it.each([
      "Update README",
      "bun: update the lockfile",
      "Tabs Hero Player PRD (#1)",
      "feat add a parser",
      "feat:add a parser",
      "feat(): add a parser",
      "Feat: add a parser",
      "",
    ])("rejects %j", (subject) => {
      expect(isConventionalSubject(subject)).toBe(false);
    });
  });

  describe("the command", () => {
    let directory = "";
    const script = join(import.meta.dir, "check-commit-subject.ts");
    const run = (...args: ReadonlyArray<string>) =>
      Bun.spawnSync(["bun", script, ...args], { stdout: "pipe", stderr: "pipe" });
    const messageFile = (text: string): string => {
      const file = join(directory, `message-${Math.random().toString(36).slice(2)}`);
      writeFileSync(file, text);
      return file;
    };

    beforeAll(() => {
      directory = mkdtempSync(join(tmpdir(), "commit-subject-"));
    });
    afterAll(() => {
      rmSync(directory, { recursive: true, force: true });
    });

    it("accepts a message file whose first line conforms", () => {
      const result = run("--file", messageFile("feat: add X\n\nA body that is not checked.\n"));
      expect(result.exitCode).toBe(0);
    });

    it("rejects a message file whose first line does not conform, and says which", () => {
      const result = run("--file", messageFile("Update README\n"));
      expect(result.exitCode).toBe(1);
      expect(result.stderr.toString()).toContain(
        'Not a Conventional Commits subject: "Update README"',
      );
    });

    describe("with a revision range", () => {
      let repository = "";
      // A hook exports its repository variables; left in, they point these commands
      // at the repository that is committing instead of the temporary one.
      const cleanEnv = () =>
        Object.fromEntries(
          Object.entries(Bun.env).filter(([name]) => !name.startsWith("GIT_")),
        ) as Record<string, string>;
      const git = (...args: ReadonlyArray<string>) =>
        Bun.spawnSync(
          ["git", "-c", "user.name=Test", "-c", "user.email=test@example.com", ...args],
          {
            cwd: repository,
            env: cleanEnv(),
            stdout: "pipe",
            stderr: "pipe",
          },
        );
      const rangeFrom = (base: string) =>
        Bun.spawnSync(["bun", script, "--range", `${base}..HEAD`], {
          cwd: repository,
          env: cleanEnv(),
          stdout: "pipe",
          stderr: "pipe",
        });

      beforeAll(() => {
        repository = join(directory, "repository");
        mkdirSync(repository);
        git("init", "--quiet", "--initial-branch=main");
        git("commit", "--quiet", "--allow-empty", "-m", "chore: start");
      });

      it("accepts an empty revision range", () => {
        expect(rangeFrom("HEAD").exitCode).toBe(0);
      });

      it("accepts commits that conform, and the merge commit that CI makes of a pull request", () => {
        git("checkout", "--quiet", "-b", "pull-request");
        git("commit", "--quiet", "--allow-empty", "-m", "feat: add X");
        git("checkout", "--quiet", "main");
        git(
          "merge",
          "--quiet",
          "--no-ff",
          "-m",
          "Origin merge of the pull request",
          "pull-request",
        );
        expect(rangeFrom("HEAD~1").exitCode).toBe(0);
      });

      it("rejects a commit that does not conform, and says which", () => {
        git("commit", "--quiet", "--allow-empty", "-m", "Update the README");
        const result = rangeFrom("HEAD~1");
        expect(result.exitCode).toBe(1);
        expect(result.stderr.toString()).toContain('"Update the README"');
      });
    });

    it("explains the usage when it is called with nothing", () => {
      const result = run();
      expect(result.exitCode).toBe(2);
      expect(result.stderr.toString()).toContain("Usage:");
    });
  });
});
