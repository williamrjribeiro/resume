/** The résumé for language models: llms.txt, and the whole résumé as Markdown. */
import { beforeAll, describe, expect, it } from "bun:test";
import { loadContentSources } from "../../test/support/files.ts";
import { llmsTxtProblems } from "../../test/support/llms.ts";
import { buildResume } from "./content.ts";
import { author } from "./data/author.ts";
import { site } from "./data/site.ts";
import {
  buildLlmsTxt,
  buildResumeMarkdown,
  inlineHtmlToMarkdown,
  type LlmsOptions,
} from "./llms.ts";

describe("llms", () => {
  describe("inlineHtmlToMarkdown", () => {
    it("turns bold and italic tags into Markdown", () => {
      expect(inlineHtmlToMarkdown("<b>Role:</b> did <i>things</i> and <strong>more</strong>")).toBe(
        "**Role:** did *things* and **more**",
      );
    });
  });

  describe("with a small résumé", () => {
    const resume = buildResume({
      "/src/content/introduction.md": "---\ntitle: About Me\n---\nHello <b>there</b>.",
      "/src/content/gap-year.md": "---\ntitle: Gap Year\n---\nTravel.",
      "/src/content/work/2020-a.md":
        "---\ntitle: Engineer\norganization: Acme [UK]\norganizationUrl: https://acme.example/\nlocation: Lisbon, PT\nstart: 2020-01-01\n---\nBuilt <b>things</b>.",
      "/src/content/work/2010-b.md":
        "---\ntitle: Intern\norganization: Old Co\nlocation: Rome, IT\nstart: 2010-01-01\nend: 2011-06-01\n---\n",
      "/src/content/apps/2013-app.md":
        "---\ntitle: Wappy\nsourceCodeUrl: https://github.com/x/wappy\nstoreUrl: https://store.example/wappy\nstart: 2013-01-01\nend: 2014-01-01\n---\nAn app.",
      "/src/content/education/2003-uni.md":
        "---\ntitle: Bachelor\norganization: Uni\nstart: 2003-03-01\nend: 2008-11-01\n---\n",
    });
    const options: LlmsOptions = { resume, author, siteUrl: "https://example.com/cv/" };
    const llms = buildLlmsTxt(options);
    const markdown = buildResumeMarkdown(options);

    it("makes an llms.txt that follows the format", () => {
      expect(llmsTxtProblems(llms)).toEqual([]);
    });

    it("names the person and summarizes the site in the first lines", () => {
      expect(llms).toStartWith(
        `# ${author.name}\n\n> Online résumé of ${author.name}, ${author.occupation} in Lisbon, Portugal`,
      );
    });

    it("links the Markdown résumé and the page by absolute address", () => {
      expect(llms).toContain("[Résumé in Markdown](https://example.com/cv/index.html.md)");
      expect(llms).toContain("[Résumé web page](https://example.com/cv/)");
    });

    it("lists the jobs newest first, with dates and place, linked to the organization", () => {
      expect(llms).toContain(
        "- [Engineer at Acme \\[UK\\]](https://acme.example/): 2020-01 – present, Lisbon, PT.",
      );
      expect(llms.indexOf("Engineer at Acme")).toBeLessThan(llms.indexOf("Intern at Old Co"));
    });

    it("links an entry without a site to the Markdown résumé", () => {
      expect(llms).toContain(
        "[Intern at Old Co](https://example.com/cv/index.html.md): 2010-01 – 2011-06, Rome, IT.",
      );
    });

    it("puts the apps in the Optional section, which is last, linked to their source", () => {
      expect(llms).toMatch(
        /## Optional\n- \[Wappy\]\(https:\/\/github\.com\/x\/wappy\): Indie app, 2013-01 – 2014-01\.\n$/,
      );
    });

    it("keeps the education in the text, because it has no address to link", () => {
      expect(llms).toContain("- Education: Bachelor, Uni (2003-03 – 2008-11)");
    });

    it("makes the whole résumé in the order of the page", () => {
      const headings = [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
      expect(headings).toEqual([
        "About Me",
        "Work Experience",
        "Indie Apps",
        "Skills",
        "Languages",
        "Education",
        "Volunteering",
        "Gap Year",
      ]);
      expect(markdown).toStartWith(
        `# ${author.name}\n\n${author.occupation} · Lisbon, Portugal · ${author.pronouns}`,
      );
    });

    it("gives each entry a heading, a line of facts and its text as Markdown", () => {
      expect(markdown).toContain(
        "### Engineer, Acme [UK]\n\n[Acme \\[UK\\]](https://acme.example/) · Lisbon, PT · 2020-01 – present\n\nBuilt **things**.",
      );
      expect(markdown).toContain(
        "### Wappy\n\n2013-01 – 2014-01 · [Source](https://github.com/x/wappy) · [Store](https://store.example/wappy)\n\nAn app.",
      );
    });

    it("has no HTML tags left", () => {
      expect(llms + markdown).not.toMatch(/<\/?(b|i|strong|em)>/);
    });
  });

  describe("with the real résumé", () => {
    let llms = "";
    let markdown = "";

    beforeAll(async () => {
      const options = {
        resume: buildResume(await loadContentSources()),
        author,
        siteUrl: site.url,
      };
      llms = buildLlmsTxt(options);
      markdown = buildResumeMarkdown(options);
    });

    it("makes an llms.txt that follows the format", () => {
      expect(llmsTxtProblems(llms)).toEqual([]);
    });

    it("lists every job and the organization it links to", () => {
      const jobs = llms.split("## Work Experience\n")[1]?.split("\n\n")[0]?.split("\n") ?? [];
      expect(jobs).toHaveLength(8);
      expect(llms).toContain(
        "[Principal Software Engineer at Hala Systems Inc.](https://www.halasystems.com/)",
      );
    });

    it("does not publish the email address or the telephone number, which the page hides from scrapers", () => {
      for (const text of [llms, markdown]) {
        expect(text).not.toContain(author.email);
        expect(text).not.toContain(author.email.split("@")[0] ?? "");
        expect(text).not.toContain(author.telephone);
        expect(text.replace(/\s/g, "")).not.toContain(author.telephone.replace(/\s/g, ""));
      }
    });

    it("has every job and degree of the page in the Markdown résumé", () => {
      for (const title of [
        "Principal Software Engineer",
        "Frontend Software Engineer",
        "Bachelor of Computer Science",
        "Java SE 6 Programmer",
      ]) {
        expect(markdown).toContain(`### ${title}`);
      }
    });
  });
});
