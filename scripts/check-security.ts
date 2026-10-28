/**
 * Checks the Content Security Policy in the pages of a build against what Lighthouse's Trust and Safety
 * audits ask for (`csp-xss`, `trusted-types-xss`), with Google's CSP evaluator, the library Lighthouse
 * uses. CI runs it on the build before deploying:
 *
 *   bun scripts/check-security.ts [build]
 */
import {
  evaluateForFailure,
  evaluateForSyntaxErrors,
  evaluateForWarnings,
} from "csp_evaluator/dist/lighthouse/lighthouse_checks.js";
import { CspParser } from "csp_evaluator/dist/parser.js";
import { cspFromHtml } from "./security-headers.ts";

/** What is wrong with the CSP of a page; empty when it is as strict as the audits want. */
export const securityProblems = (html: string): ReadonlyArray<string> => {
  const policy = cspFromHtml(html);
  if (policy === undefined) return ["the page has no CSP <meta> tag"];

  const parsed = [new CspParser(policy).csp];
  const findings = [
    ...evaluateForFailure(parsed),
    ...evaluateForSyntaxErrors(parsed).flat(),
    ...evaluateForWarnings(parsed),
  ];
  const problems = findings.map((finding) => `${finding.directive}: ${finding.description}`);

  const directives = new Map(
    policy
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .map(([name = "", ...sources]) => [name, sources] as const),
  );
  for (const required of ["default-src", "script-src", "object-src", "base-uri"]) {
    if (!directives.has(required)) problems.push(`${required} is missing`);
  }
  if (!directives.get("require-trusted-types-for")?.includes("'script'")) {
    problems.push("require-trusted-types-for 'script' is missing");
  }
  const scripts = directives.get("script-src") ?? [];
  if (scripts.some((source) => source === "'unsafe-eval'")) problems.push("script-src allows eval");
  if (!scripts.some((source) => /^'sha(?:256|384|512)-/.test(source))) {
    problems.push("script-src has no hash for the page's inline script");
  }
  return problems;
};

if (import.meta.main) {
  const directory = Bun.argv[2] ?? "build";
  let failed = false;
  for await (const path of new Bun.Glob("**/*.html").scan(directory)) {
    const problems = securityProblems(await Bun.file(`${directory}/${path}`).text());
    if (problems.length > 0) {
      failed = true;
      console.error(
        `${directory}/${path}:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`,
      );
    }
  }
  if (failed) process.exit(1);
  console.log(`${directory}: the CSP of every page is as strict as Lighthouse asks`);
}
