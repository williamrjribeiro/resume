/**
 * Downloads Chrome for Testing for the local `agent-browser` CLI.
 *
 * Run it by hand after `bun install` (`bun scripts/install-agent-browser-chrome.ts`). It is not a
 * bun lifecycle script, so `CI=true bun install` (GitHub Actions) does not download
 * a browser. Idempotent: skips when Chrome for Testing is already under
 * `~/.agent-browser/browsers`.
 */

export type SpawnResult = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

export type InstallAgentBrowserChromeOptions = {
  readonly home?: string;
  readonly platform?: "linux" | "darwin" | "win32";
  readonly install?: (args: ReadonlyArray<string>) => SpawnResult;
  readonly log?: (message: string) => void;
};

const homeDir = (): string => Bun.env.HOME ?? Bun.env.USERPROFILE ?? "";

export const chromeForTestingPath = (home: string): string | undefined => {
  const browsers = `${home}/.agent-browser/browsers`;
  try {
    for (const pattern of ["chrome-*/chrome", "chrome-*/chrome.exe"] as const) {
      for (const relative of new Bun.Glob(pattern).scanSync(browsers)) {
        return `${browsers}/${relative}`;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
};

const defaultInstall =
  (log: (message: string) => void) =>
  (args: ReadonlyArray<string>): SpawnResult => {
    const bin = `${import.meta.dir}/../node_modules/.bin/agent-browser`;
    const result = Bun.spawnSync([bin, ...args], { stdout: "pipe", stderr: "pipe" });
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();
    if (stdout !== "") log(stdout.replace(/\s+$/, ""));
    if (stderr !== "") log(stderr.replace(/\s+$/, ""));
    return { exitCode: result.exitCode, stdout, stderr };
  };

export const installAgentBrowserChrome = (
  options: InstallAgentBrowserChromeOptions = {},
): number => {
  const home = options.home ?? homeDir();
  const platform =
    options.platform ??
    (process.platform === "linux" || process.platform === "darwin" || process.platform === "win32"
      ? process.platform
      : "linux");
  const log = options.log ?? ((message) => console.log(message));
  const existing = chromeForTestingPath(home);
  if (existing !== undefined) {
    log(`Skipping agent-browser Chrome install: already at ${existing}`);
    return 0;
  }

  const args =
    platform === "linux" ? (["install", "--with-deps"] as const) : (["install"] as const);
  log(`Installing Chrome for Testing (${args.join(" ")})`);
  const result = (options.install ?? defaultInstall(log))([...args]);
  if (result.exitCode !== 0) {
    const detail = result.stderr.trim() === "" ? `exit ${result.exitCode}` : result.stderr.trim();
    log(`agent-browser Chrome install failed: ${detail}`);
  }
  return result.exitCode;
};

if (import.meta.main) process.exit(installAgentBrowserChrome());
