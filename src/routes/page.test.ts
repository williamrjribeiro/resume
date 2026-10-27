/** The whole page, rendered from the real content in src/content the way the build prerenders it. */
import { beforeAll, describe, expect, it } from "bun:test";
import { checkHCard } from "../../scripts/check-microformats.ts";
import { loadContentSources } from "../../test/support/files.ts";
import { parseMicroformats } from "../../test/support/microformats.ts";
import { renderComponent } from "../../test/support/render.ts";
import { buildResume } from "#lib/content.ts";
import { author } from "#lib/data/author.ts";
import { site, strings } from "#lib/data/site.ts";
import Page from "./+page.svelte";

describe("the page", () => {
  let body = "";
  let head = "";
  let items: ReturnType<typeof parseMicroformats>["items"] = [];

  beforeAll(async () => {
    const resume = buildResume(await loadContentSources());
    ({ body, head } = renderComponent(Page, {
      data: { resume, builtAt: "2026-10-27T23:15:00.000Z" },
      params: {},
      form: undefined,
    }));
    ({ items } = parseMicroformats(body));
  });

  describe("microformats", () => {
    it("has the author's h-card and the résumé, both at the top level", () => {
      expect(items.map((item) => item.type)).toEqual([["h-card"], ["h-resume"]]);
    });

    it("has a complete h-card that parsers can use as the page's representative card", () => {
      expect(checkHCard(body, site.url)).toEqual([]);
    });

    it("lists the jobs, the apps, the degrees and the volunteering as the résumé's h-events", () => {
      const resume = items[1];
      const count = (property: string) => (resume?.properties[property] ?? []).length;
      expect(count("experience")).toBe(7);
      expect(count("apps")).toBe(2);
      expect(count("education")).toBe(2);
      expect(count("volunteering")).toBe(4);
    });

    it("lists the skills and the languages as skills of the résumé", () => {
      expect(items[1]?.properties["skill"]).toHaveLength(
        author.skills.length + author.languages.length,
      );
    });

    it("summarizes the résumé with the introduction", () => {
      expect(items[1]?.properties["summary"]?.[0]).toContain("senior full-stack engineer");
    });
  });

  describe("content", () => {
    it("has one h1, the author's name", () => {
      expect(body.match(/<h1[ >]/g)).toHaveLength(1);
      expect(body).toMatch(new RegExp(`<h1[^>]*>${author.name}</h1>`));
    });

    it("has the sections in order", () => {
      const ids = [...body.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]);
      expect(ids).toEqual([
        "section-introduction",
        "section-experience",
        "section-apps",
        "section-skills",
        "section-languages",
        "section-education",
        "section-volunteering",
        "section-gap-year",
      ]);
    });

    it("titles the sections", () => {
      for (const title of Object.values(strings.titles)) {
        expect(body).toContain(title);
      }
    });

    it("shows the newest job first", () => {
      expect(body.indexOf("Principal Software Engineer")).toBeLessThan(
        body.indexOf("Frontend Software Engineer"),
      );
    });

    it("opens every link to another site in a new tab without handing over the opener", () => {
      const external = [...body.matchAll(/<a [^>]*href="https?:[^>]*>/g)].map((match) => match[0]);
      const entryLinks = external.filter((tag) => tag.includes('target="_blank"'));
      expect(entryLinks.length).toBeGreaterThan(10);
      for (const tag of entryLinks) {
        expect(tag).toContain('rel="noopener noreferrer"');
      }
    });
  });

  describe("print", () => {
    it("leaves out the early jobs, the volunteering and the gap year", () => {
      expect(body.match(/<li [^>]*print:hidden/g)).toHaveLength(3);
      expect(body).toMatch(/<section id="section-volunteering" class="[^"]*print:hidden/);
      expect(body).toMatch(/<section id="section-gap-year" class="[^"]*print:hidden/);
    });
  });

  describe("footer", () => {
    it("says when the site was built", () => {
      expect(body).toContain("Last updated: 27.10.2026");
    });
  });

  describe("head", () => {
    it("has the title and description of the page", () => {
      expect(head).toContain("<title>");
      expect(head).toContain('name="description"');
    });
  });
});
