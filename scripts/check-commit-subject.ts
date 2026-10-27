/**
 * Checks that commit subjects follow Conventional Commits (AGENTS.md, Commits).
 *
 *   bun scripts/check-commit-subject.ts --file <path>    the message file of one commit (the commit-msg hook)
 *   bun scripts/check-commit-subject.ts --range <range>  every non-merge commit in a git revision range (CI)
 *
 * Exits 0 when every subject conforms, 1 when one does not, 2 on a usage error.
 */
import { readFileSync } from "node:fs";
import { $ } from "bun";

const CONVENTIONAL_SUBJECT =
  /^((feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9./-]+\))?!?: .+|Merge .+|Revert ".+"|(fixup|squash|amend)! .+)$/;

export const isConventionalSubject = (subject: string): boolean =>
  CONVENTIONAL_SUBJECT.test(subject);

/**
 * The subject lines of the commits in a revision range, newest first. Merge commits are
 * left out: CI checks out a pull request as a merge commit of its own, whose subject is not ours.
 */
export const subjectsIn = async (range: string): Promise<ReadonlyArray<string>> => {
  const log = await $`git log --no-merges --format=%s ${range}`.quiet();
  return log
    .text()
    .split("\n")
    .filter((line) => line !== "");
};

const USAGE = "Usage: bun scripts/check-commit-subject.ts --file <path> | --range <revision range>";

const run = async (args: ReadonlyArray<string>): Promise<number> => {
  const [mode, value] = args;
  if ((mode !== "--file" && mode !== "--range") || value === undefined) {
    console.error(USAGE);
    return 2;
  }
  const subjects =
    mode === "--file"
      ? [readFileSync(value, "utf8").split("\n")[0] ?? ""]
      : await subjectsIn(value);
  const rejected = subjects.filter((subject) => !isConventionalSubject(subject));
  for (const subject of rejected) {
    console.error(`Not a Conventional Commits subject: ${JSON.stringify(subject)}`);
  }
  if (rejected.length > 0) {
    console.error(
      "Use a subject like `feat(api): add X`. The types are feat, fix, docs, style, refactor, perf, test, build, ci, chore and revert.",
    );
    return 1;
  }
  return 0;
};

if (import.meta.main) process.exit(await run(Bun.argv.slice(2)));
