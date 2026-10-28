/** The obfuscated `mailto:` link. */
import { describe, expect, it } from "bun:test";
import { emailLinkHtml, escapeHtml } from "./email-link.ts";

describe("email-link", () => {
  describe("escapeHtml", () => {
    it("escapes what could end an attribute or open a tag", () => {
      expect(escapeHtml(`<a href="x" onclick='y'>&`)).toBe(
        "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;",
      );
    });
  });

  describe("emailLinkHtml", () => {
    const base = { email: "a@b.c", label: "Email" };

    it("never writes the address as plain text", () => {
      expect(emailLinkHtml(base)).not.toContain("a@b.c");
      expect(emailLinkHtml(base)).toContain('href="mailto:&#97;&#64;&#98;&#46;&#99;"');
    });

    it("is an icon button named by its label when it shows no text", () => {
      expect(emailLinkHtml({ ...base, icon: "<svg></svg>" })).toBe(
        '<a class="" href="mailto:&#97;&#64;&#98;&#46;&#99;" aria-label="Email"><svg></svg></a>',
      );
    });

    it("shows the address as its own name when it shows text", () => {
      const html = emailLinkHtml({ ...base, showText: true });
      expect(html).toContain("<span>&#97;&#64;&#98;&#46;&#99;</span>");
      expect(html).not.toContain("aria-label");
    });

    it("escapes the class and the label, which are not entities", () => {
      const html = emailLinkHtml({ ...base, label: '"><script>', className: '"><b>' });
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<b>");
    });
  });
});
