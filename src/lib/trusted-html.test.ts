/** Marking the résumé's own HTML as trusted, which the page's Content Security Policy requires. */
import { describe, expect, it } from "bun:test";
import { createTrustedHtml, trustedHtml, trustedHtmlPolicyName } from "./trusted-html.ts";

describe("trusted-html", () => {
  /** A stand-in for `window.trustedTypes`: it wraps the string in an object, as the browser's TrustedHTML does. */
  const factory = () => {
    const policies: Array<string> = [];
    return {
      policies,
      factory: {
        createPolicy: (name: string, rules: { createHTML(html: string): string }) => {
          if (policies.includes(name)) {
            throw new TypeError(`Policy with name "${name}" already exists.`);
          }
          policies.push(name);
          return { createHTML: (html: string) => ({ trusted: rules.createHTML(html) }) as never };
        },
      },
    };
  };

  describe("createTrustedHtml", () => {
    it("hands the HTML to a policy named for the résumé's content, so the browser accepts it", () => {
      const { policies, factory: trustedTypes } = factory();
      const mark = createTrustedHtml(trustedTypes);
      expect(policies).toEqual([trustedHtmlPolicyName]);
      expect(mark("<p>Hi</p>")).toEqual({ trusted: "<p>Hi</p>" } as never);
    });

    it("leaves the HTML a string where there are no Trusted Types, as on the server", () => {
      expect(createTrustedHtml(undefined)("<p>Hi</p>")).toBe("<p>Hi</p>");
    });

    it("leaves the HTML a string when the browser refuses a second policy of the same name", () => {
      const { factory: trustedTypes } = factory();
      createTrustedHtml(trustedTypes);
      expect(createTrustedHtml(trustedTypes)("<p>Hi</p>")).toBe("<p>Hi</p>");
    });
  });

  describe("trustedHtml", () => {
    it("is plain text under test and on the server, which have no window", () => {
      expect(trustedHtml("<p>Hi</p>")).toBe("<p>Hi</p>");
    });
  });

  describe("the Content Security Policy", () => {
    it("allows the policy the page creates", async () => {
      const config = await Bun.file(`${import.meta.dir}/../../vite.config.ts`).text();
      expect(config).toMatch(
        new RegExp(`"trusted-types": \\[[^\\]]*"${trustedHtmlPolicyName}"[^\\]]*\\]`),
      );
    });

    it("keeps Svelte's own policy, which it uses for the HTML of its templates", async () => {
      const config = await Bun.file(`${import.meta.dir}/../../vite.config.ts`).text();
      expect(config).toContain('"svelte-trusted-html"');
    });
  });
});
