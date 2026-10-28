/**
 * Only the Bun in `.bun-version` is used here: on a machine, in the git hooks and in CI. A different Bun
 * can behave differently (1.4.3 ignores `bun pm version --dry-run`, and 1.4.4 does not), and that has
 * already shown up as a failure in CI only.
 *
 * `.bun-version` is the one place that says which version. `oven-sh/setup-bun` reads it in the
 * workflows, `packageManager`, `engines` and `@types/bun` in package.json must say the same, and this
 * fails when the Bun that runs it is another one. It runs before every `bun install` (the `preinstall`
 * script) and in the tests, so the hooks and CI check it too.
 *
 *   bun scripts/check-bun-version.ts
 */
import { join } from "node:path";

export type BunVersionSources = {
  /** `.bun-version` */
  readonly pinned: string;
  /** The Bun that is running. */
  readonly running: string;
  /** `packageManager` in package.json, such as `bun@1.4.4`. */
  readonly packageManager: string | undefined;
  /** `engines.bun` in package.json. */
  readonly engine: string | undefined;
  /** The version of `@types/bun` in package.json. */
  readonly types: string | undefined;
};

/** What disagrees with the pinned version; empty when only that Bun is in use. */
export const bunVersionProblems = (sources: BunVersionSources): ReadonlyArray<string> => {
  const { pinned } = sources;
  const problems: Array<string> = [];
  if (!/^\d+\.\d+\.\d+$/.test(pinned)) {
    return [`.bun-version must hold one exact version such as 1.4.4, not "${pinned}"`];
  }
  if (sources.running !== pinned) {
    problems.push(
      `Bun ${pinned} is required (.bun-version), but this is Bun ${sources.running}. Install it with: curl -fsSL https://bun.com/install | bash -s "bun-v${pinned}"`,
    );
  }
  const expected: ReadonlyArray<readonly [string, string | undefined, string]> = [
    ["packageManager in package.json", sources.packageManager, `bun@${pinned}`],
    ["engines.bun in package.json", sources.engine, pinned],
    ["@types/bun in package.json", sources.types, pinned],
  ];
  for (const [name, actual, wanted] of expected) {
    if (actual !== wanted) {
      problems.push(`${name} is "${actual ?? "missing"}", but it must be "${wanted}"`);
    }
  }
  return problems;
};

/** The pinned version and the places that have to agree with it, read from a repository. */
export const readBunVersionSources = async (root: string): Promise<BunVersionSources> => {
  const manifest = JSON.parse(await Bun.file(join(root, "package.json")).text()) as {
    packageManager?: string;
    engines?: { bun?: string };
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };
  return {
    pinned: (await Bun.file(join(root, ".bun-version")).text()).trim(),
    running: Bun.version,
    packageManager: manifest.packageManager,
    engine: manifest.engines?.bun,
    types: manifest.devDependencies?.["@types/bun"] ?? manifest.dependencies?.["@types/bun"],
  };
};

if (import.meta.main) {
  const root = Bun.fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
  const problems = bunVersionProblems(await readBunVersionSources(root));
  if (problems.length > 0) {
    console.error(problems.map((problem) => `- ${problem}`).join("\n"));
    process.exit(1);
  }
  console.log(`Bun ${Bun.version}: the only version in use`);
}
