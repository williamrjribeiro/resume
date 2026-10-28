/**
 * Installs Lefthook git hooks after `bun install` (`prepare`).
 *
 * Skips when CI=true (Depot/GitHub) or when `.git` is missing. Never uses
 * LEFTHOOK=1, `lefthook install --force`, or `--reset-hooks-path`.
 *
 * Cursor cloud agents set local `core.hooksPath` to
 * `~/.cursor/agent-hooks/<id>/`. Lefthook refuses that path by default;
 * --force would overwrite Cursor's dispatcher, and --reset-hooks-path would
 * drop Cursor chaining. Unset hooksPath, install into `.git/hooks`, restore
 * hooksPath, then point `.cursor-original-hooks-path` at the repo hooks and
 * keep pre-commit/commit-msg as dispatcher symlinks.
 *
 * Failures are warnings: this must not fail `bun install`.
 */
import {
  existsSync,
  lstatSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

export type SpawnResult = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

export type InstallGitHooksOptions = {
  readonly root: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly lefthookInstall?: (args: ReadonlyArray<string>) => SpawnResult;
  readonly warn?: (message: string) => void;
};

const CURSOR_AGENT_HOOKS = ".cursor/agent-hooks";
const CHAINED_HOOKS = ["pre-commit", "commit-msg"] as const;

const isCursorAgentHooksPath = (hooksPath: string): boolean =>
  hooksPath.replaceAll("\\", "/").includes(CURSOR_AGENT_HOOKS);

/** Child processes act on `root`, never on a repository named by GIT_DIR / GIT_INDEX_FILE. */
export const withoutGitEnv = (env: NodeJS.ProcessEnv = Bun.env): Record<string, string> =>
  Object.fromEntries(
    Object.entries(env).filter(
      (entry): entry is [string, string] => !entry[0].startsWith("GIT_") && entry[1] !== undefined,
    ),
  );

const runGit = (root: string, args: ReadonlyArray<string>): SpawnResult => {
  const result = Bun.spawnSync(["git", ...args], {
    cwd: root,
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

const localHooksPath = (root: string): string | undefined => {
  const result = runGit(root, ["config", "--local", "--get", "core.hooksPath"]);
  const value = result.stdout.trim();
  if (result.exitCode !== 0 || value === "") return undefined;
  return value;
};

const repoHooksDir = (root: string): string => {
  const result = runGit(root, ["rev-parse", "--path-format=absolute", "--git-path", "hooks"]);
  const value = result.stdout.trim();
  return value === "" ? join(root, ".git", "hooks") : value;
};

const defaultLefthookInstall =
  (root: string) =>
  (args: ReadonlyArray<string>): SpawnResult => {
    const lefthook = join(import.meta.dir, "..", "node_modules", ".bin", "lefthook");
    if (!existsSync(lefthook)) {
      return { exitCode: 1, stdout: "", stderr: `lefthook binary not found at ${lefthook}` };
    }
    const result = Bun.spawnSync([lefthook, ...args], {
      cwd: root,
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

const ensureDispatcherSymlink = (
  agentHooksDir: string,
  hook: string,
  warn: (message: string) => void,
): void => {
  const dispatcher = join(agentHooksDir, ".dispatcher");
  if (!existsSync(dispatcher)) {
    warn(`Cursor agent-hooks dispatcher missing at ${dispatcher}`);
    return;
  }
  const dest = join(agentHooksDir, hook);
  try {
    if (lstatSync(dest).isSymbolicLink() && readlinkSync(dest) === ".dispatcher") return;
  } catch {
    // Missing or not a symlink — replace below.
  }
  try {
    unlinkSync(dest);
  } catch {
    // Nothing to remove.
  }
  symlinkSync(".dispatcher", dest);
};

const chainCursorAgentHooks = (
  agentHooksDir: string,
  originalHooksDir: string,
  warn: (message: string) => void,
): void => {
  writeFileSync(join(agentHooksDir, ".cursor-original-hooks-path"), `${originalHooksDir}\n`);
  for (const hook of CHAINED_HOOKS) {
    ensureDispatcherSymlink(agentHooksDir, hook, warn);
  }
};

export const installGitHooks = (options: InstallGitHooksOptions): number => {
  const { root } = options;
  const env = options.env ?? process.env;
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const lefthookInstall = options.lefthookInstall ?? defaultLefthookInstall(root);

  const runLefthookInstall = (): void => {
    const result = lefthookInstall(["install"]);
    if (result.stdout.trim() !== "") console.log(result.stdout.trimEnd());
    if (result.exitCode !== 0) {
      const detail = result.stderr.trim() === "" ? `exit ${result.exitCode}` : result.stderr.trim();
      warn(`lefthook install failed: ${detail}`);
    }
  };

  try {
    if (env.CI === "true") {
      console.log("Skipping lefthook install because CI=true.");
      return 0;
    }
    if (!existsSync(join(root, ".git"))) {
      console.log("Skipping lefthook install because .git is missing.");
      return 0;
    }

    const hooksPath = localHooksPath(root);
    if (hooksPath === undefined) {
      runLefthookInstall();
      return 0;
    }
    if (!isCursorAgentHooksPath(hooksPath)) {
      warn(
        `Skipping lefthook install: core.hooksPath is ${hooksPath} (not a Cursor agent-hooks directory).`,
      );
      return 0;
    }

    let originalHooks = join(root, ".git", "hooks");
    try {
      runGit(root, ["config", "--local", "--unset-all", "core.hooksPath"]);
      originalHooks = repoHooksDir(root);
      runLefthookInstall();
    } finally {
      runGit(root, ["config", "--local", "core.hooksPath", hooksPath]);
    }
    chainCursorAgentHooks(resolve(root, hooksPath), originalHooks, warn);
  } catch (cause) {
    warn(`Could not install lefthook hooks: ${String(cause)}`);
  }
  return 0;
};

if (import.meta.main) process.exit(installGitHooks({ root: join(import.meta.dir, "..") }));
