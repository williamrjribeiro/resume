/** The h-card check that gates the deploy. */
import { describe, expect, it } from "bun:test";
import { checkHCard } from "./check-microformats.ts";

describe("check-microformats", () => {
  describe("checkHCard", () => {
    const url = "https://example.com/resume/";
    const card = (inner = "") => `
      <div class="h-card">
        <img class="u-photo" src="/me.jpg" alt="">
        <h1 class="p-name">Jane Doe</h1>
        <span class="p-job-title">Engineer</span>
        <a class="u-email" href="mailto:jane@example.com">mail</a>
        <span class="p-tel">+1 555 0100</span>
        <a class="u-url u-uid" href="${url}">home</a>
        ${inner}
      </div>`;

    it("accepts a complete h-card", () => {
      expect(checkHCard(card(), url)).toEqual([]);
    });

    it("reports a page without an h-card", () => {
      expect(checkHCard("<p>Hello</p>", url)).toEqual(["there is no top-level h-card"]);
    });

    it("reports a card nested in another microformat, which parsers do not find as the page's h-card", () => {
      expect(checkHCard(`<main class="h-resume">${card()}</main>`, url)).toEqual([
        "there is no top-level h-card",
      ]);
    });

    it("reports each missing property", () => {
      const html = `<div class="h-card"><span class="p-name">Jane</span><a class="u-url u-uid" href="${url}">home</a></div>`;
      expect(checkHCard(html, url)).toEqual([
        "the h-card has no photo",
        "the h-card has no job-title",
        "the h-card has no email",
        "the h-card has no tel",
      ]);
    });

    it("reports a uid that is not the page URL", () => {
      const html = card().replace(`u-uid" href="${url}"`, `u-uid" href="https://other.example/"`);
      expect(checkHCard(html, url)).toEqual([`the h-card's uid is not the page URL ${url}`]);
    });
  });
});
