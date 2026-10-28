/** The security headers behind Lighthouse's Trust and Safety audits. */
import { describe, expect, it } from "bun:test";
import { cspFromHtml, HSTS, isLocalhostName, securityHeaders } from "./security-headers.ts";

describe("security-headers", () => {
  const policy = "default-src 'none'; script-src 'self' 'sha256-abc=' 'unsafe-inline'";
  const page = `<head><meta http-equiv="content-security-policy" content="${policy}"></head>`;

  describe("cspFromHtml", () => {
    it("reads the policy of the meta tag", () => {
      expect(cspFromHtml(page)).toBe(policy);
    });

    it("reads it whatever the order of the attributes", () => {
      expect(
        cspFromHtml(`<meta content="img-src 'self'" http-equiv="Content-Security-Policy">`),
      ).toBe("img-src 'self'");
    });

    it("decodes the entities of the attribute", () => {
      expect(
        cspFromHtml(
          `<meta http-equiv="content-security-policy" content="a &amp; b &quot;c&quot;">`,
        ),
      ).toBe('a & b "c"');
    });

    it("finds nothing in a page without one", () => {
      expect(cspFromHtml("<p>Hello</p>")).toBeUndefined();
    });
  });

  describe("isLocalhostName", () => {
    it.each(["localhost", "app.localhost"])("is true for %s", (host) => {
      expect(isLocalhostName(host)).toBe(true);
    });

    it.each(["127.0.0.1", "[::1]", "192.168.1.5", "box.local", "example.com", "notlocalhost"])(
      "is false for %s",
      (host) => {
        expect(isLocalhostName(host)).toBe(false);
      },
    );
  });

  describe("securityHeaders", () => {
    it("sends the page's own policy as a header, with the directive a meta tag cannot carry", () => {
      expect(
        securityHeaders({ hostname: "127.0.0.1", html: page })["content-security-policy"],
      ).toBe(`${policy}; frame-ancestors 'none'`);
    });

    it("sends no policy for a file that is not a page", () => {
      expect(securityHeaders({ hostname: "127.0.0.1" })).not.toHaveProperty(
        "content-security-policy",
      );
    });

    it("sends no policy for a page that has none, because it has nothing to repeat", () => {
      expect(securityHeaders({ hostname: "127.0.0.1", html: "<p>x</p>" })).not.toHaveProperty(
        "content-security-policy",
      );
    });

    it("isolates the window and refuses to be framed", () => {
      const headers = securityHeaders({ hostname: "example.com" });
      expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["x-content-type-options"]).toBe("nosniff");
    });

    it("asks for HTTPS for two years, with the subdomains, as Lighthouse and the preload list want", () => {
      expect(securityHeaders({ hostname: "example.com" })["strict-transport-security"]).toBe(HSTS);
      expect(HSTS).toMatch(/max-age=(\d+); includeSubDomains; preload/);
      expect(Number(/max-age=(\d+)/.exec(HSTS)?.[1])).toBeGreaterThanOrEqual(31_536_000);
    });

    it.each(["127.0.0.1", "192.168.1.5", "box.local"])("sends HSTS to %s", (hostname) => {
      expect(securityHeaders({ hostname })).toHaveProperty("strict-transport-security");
    });

    it.each(["localhost", "app.localhost"])(
      "does not send HSTS to %s, where browsers would keep it and break every http:// address there",
      (hostname) => {
        expect(securityHeaders({ hostname })).not.toHaveProperty("strict-transport-security");
      },
    );
  });
});
