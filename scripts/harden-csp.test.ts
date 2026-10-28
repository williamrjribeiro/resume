/** The `'unsafe-inline'` fallback that is added to the CSP of the built pages. */
import { describe, expect, it } from "bun:test";
import { hardenHtml, withUnsafeInlineFallback } from "./harden-csp.ts";

describe("harden-csp", () => {
  describe("withUnsafeInlineFallback", () => {
    it("adds the keyword to a script-src that has a hash", () => {
      expect(
        withUnsafeInlineFallback(
          "default-src 'none'; script-src 'self' 'sha256-abc='; img-src 'self'",
        ),
      ).toBe("default-src 'none'; script-src 'self' 'sha256-abc=' 'unsafe-inline'; img-src 'self'");
    });

    it("adds it to a script-src that has a nonce", () => {
      expect(withUnsafeInlineFallback("script-src 'nonce-xyz'")).toBe(
        "script-src 'nonce-xyz' 'unsafe-inline'",
      );
    });

    it("does not add it where no hash or nonce makes browsers ignore it, which would let any script run", () => {
      const policy = "script-src 'self'; style-src 'sha256-abc='";
      expect(withUnsafeInlineFallback(policy)).toBe(policy);
    });

    it("leaves a policy that has the keyword alone", () => {
      expect(withUnsafeInlineFallback("script-src 'sha256-abc=' 'unsafe-inline'")).toBe(
        "script-src 'sha256-abc=' 'unsafe-inline'",
      );
    });

    it("does not touch the hashes of other directives", () => {
      expect(
        withUnsafeInlineFallback("style-src 'sha256-abc='; script-src 'self' 'sha256-def='"),
      ).toBe("style-src 'sha256-abc='; script-src 'self' 'sha256-def=' 'unsafe-inline'");
    });
  });

  describe("hardenHtml", () => {
    const page = (policy: string) =>
      `<head><meta http-equiv="content-security-policy" content="${policy}"><title>x</title></head>`;

    it("changes the policy in the meta tag and nothing else", () => {
      expect(hardenHtml(page("script-src 'self' 'sha256-abc='"))).toBe(
        page("script-src 'self' 'sha256-abc=' 'unsafe-inline'"),
      );
    });

    it("is the same on the second run", () => {
      const once = hardenHtml(page("script-src 'sha256-abc='"));
      expect(hardenHtml(once)).toBe(once);
    });

    it("leaves a page without a policy as it is", () => {
      expect(hardenHtml("<p>Hello</p>")).toBe("<p>Hello</p>");
    });
  });
});
