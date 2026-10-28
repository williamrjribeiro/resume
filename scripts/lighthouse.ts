/**
 * `bun run lighthouse`: builds the site, serves it the way `bun run prd` does, and runs Lighthouse's best
 * practices over it. Fails when any audit of the "Trust and Safety" group has a finding: no strict CSP, no
 * Trusted Types, no HSTS, no COOP, no clickjacking protection, no HTTPS.
 *
 * It uses `https://127.0.0.1`, not `localhost`: the server leaves HSTS out for `localhost`, because a
 * browser would then send every `http://localhost` address, on every port, to HTTPS for two years. It
 * needs Chrome (set `CHROME_PATH` if Lighthouse does not find it) and fetches Lighthouse with `bunx`.
 */
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureCerts } from "./certs.ts";
import { serveStatic } from "./static-server.ts";

/** Pinned: the audits of the group, and their findings, change between Lighthouse versions. */
const LIGHTHOUSE = "lighthouse@13.6.0";

const TRUST_AND_SAFETY = "best-practices-trust-safety";

type AuditResult = {
  readonly score: number | null;
  readonly title: string;
  readonly details?: { readonly items?: ReadonlyArray<Record<string, unknown>> };
};

/** The parts of a Lighthouse JSON report that are read here. */
export type LighthouseReport = {
  readonly categories: Readonly<
    Record<
      string,
      {
        readonly score: number | null;
        readonly auditRefs: ReadonlyArray<{ readonly id: string; readonly group?: string }>;
      }
    >
  >;
  readonly audits: Readonly<Record<string, AuditResult>>;
};

const describe = (item: Record<string, unknown>): string => {
  const { description, directive } = item;
  const text = typeof description === "string" ? description : JSON.stringify(description ?? item);
  return typeof directive === "string" ? `${directive}: ${text}` : text;
};

/** The failures and findings of the Trust and Safety audits; empty when the section is clean. */
export const trustAndSafetyProblems = (report: LighthouseReport): ReadonlyArray<string> => {
  const ids = (report.categories["best-practices"]?.auditRefs ?? [])
    .filter((ref) => ref.group === TRUST_AND_SAFETY)
    .map((ref) => ref.id);
  if (ids.length === 0) return ["the report has no Trust and Safety audits"];

  const problems: Array<string> = [];
  for (const id of ids) {
    const audit = report.audits[id];
    if (audit === undefined) {
      problems.push(`${id}: missing from the report`);
      continue;
    }
    if (audit.score === 0) problems.push(`${id}: failed`);
    for (const item of audit.details?.items ?? []) problems.push(`${id}: ${describe(item)}`);
  }
  return problems;
};

const main = async (): Promise<number> => {
  const build = Bun.spawnSync(["bun", "run", "build"], { stdout: "inherit", stderr: "inherit" });
  if (build.exitCode !== 0) return build.exitCode;

  const directory = join(import.meta.dir, "..", "build");
  const server = serveStatic({
    directory,
    port: 0,
    hostname: "127.0.0.1",
    tls: await ensureCerts(),
  });
  const output = join(tmpdir(), `lighthouse-${process.pid}.json`);
  try {
    const flags = [
      "--headless=new",
      "--ignore-certificate-errors",
      ...(Bun.env.CI ? ["--no-sandbox"] : []),
    ];
    const lighthouse = Bun.spawn(
      [
        "bunx",
        LIGHTHOUSE,
        `https://127.0.0.1:${server.port}/`,
        `--chrome-flags=${flags.join(" ")}`,
        "--only-categories=best-practices",
        "--output=json",
        `--output-path=${output}`,
        "--quiet",
      ],
      { stdout: "inherit", stderr: "inherit" },
    );
    const code = await lighthouse.exited;
    if (code !== 0) return code;

    const report = JSON.parse(await Bun.file(output).text()) as LighthouseReport;
    const problems = trustAndSafetyProblems(report);
    const score = report.categories["best-practices"]?.score;
    console.log(
      `\nBest practices score: ${score === null || score === undefined ? "n/a" : score * 100}`,
    );
    if (problems.length > 0) {
      console.error(
        `\nTrust and Safety:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`,
      );
      return 1;
    }
    console.log("Trust and Safety: every audit passes with no findings");
    return 0;
  } finally {
    await server.stop(true);
  }
};

if (import.meta.main) process.exit(await main());
