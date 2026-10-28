/** The check that the built pages carry a CSP as strict as Lighthouse's audits want. */
import { describe, expect, it } from "bun:test";
import { securityProblems } from "./check-security.ts";

describe("check-security", () => {
  describe("securityProblems", () => {
    const strict = [
      "default-src 'none'",
      "script-src 'self' 'sha256-HgTHU7KGkSst6uHRT46E8rrjRtba+e61xLXMg4ZRO+A=' 'unsafe-inline'",
      "style-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "require-trusted-types-for 'script'",
      "trusted-types svelte-trusted-html",
    ].join("; ");
    const page = (policy: string) =>
      `<meta http-equiv="content-security-policy" content="${policy}">`;

    it("accepts the policy the site is built with", () => {
      expect(securityProblems(page(strict))).toEqual([]);
    });

    it("reports a page without a policy", () => {
      expect(securityProblems("<p>x</p>")).toEqual(["the page has no CSP <meta> tag"]);
    });

    it("reports a script-src that lets any inline script run", () => {
      const problems = securityProblems(page(strict.replace(/'sha256-[^']*' /, "")));
      expect(problems.join("\n")).toContain("unsafe-inline");
      expect(problems).toContain("script-src has no hash for the page's inline script");
    });

    it("reports a policy without Trusted Types", () => {
      const without = strict.replace("; require-trusted-types-for 'script'", "");
      expect(securityProblems(page(without))).toContain(
        "require-trusted-types-for 'script' is missing",
      );
    });

    it("reports a policy that lacks object-src and base-uri", () => {
      const without = strict.replace("; object-src 'none'", "").replace("; base-uri 'none'", "");
      const problems = securityProblems(page(without));
      expect(problems).toContain("object-src is missing");
      expect(problems).toContain("base-uri is missing");
    });

    it("reports eval", () => {
      expect(
        securityProblems(
          page(strict.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'")),
        ),
      ).toContain("script-src allows eval");
    });

    it("reports the missing fallback for browsers that do not know hashes", () => {
      const without = strict.replace(" 'unsafe-inline'", "");
      expect(securityProblems(page(without)).join("\n")).toContain("unsafe-inline");
    });
  });
});
