/** Turning the Markdown files in src/content into the data the page shows. */
import { beforeAll, describe, expect, it } from "bun:test";
import { loadContentSources } from "../../test/support/files.ts";
import { buildResume, parseEntry, parsePage, renderMarkdown, splitFrontmatter } from "./content.ts";

describe("content", () => {
  describe("splitFrontmatter", () => {
    it("separates the YAML header from the body", () => {
      const { data, body } = splitFrontmatter("---\ntitle: Hi\nstart: 2013-01-01\n---\n\nBody");
      expect(data).toEqual({ title: "Hi", start: "2013-01-01" });
      expect(body).toBe("\nBody");
    });

    it("treats a file without a header as all body", () => {
      expect(splitFrontmatter("Just text")).toEqual({ data: {}, body: "Just text" });
    });
  });

  describe("renderMarkdown", () => {
    it("renders emphasis and keeps raw HTML", () => {
      expect(renderMarkdown("**Bold** and <i>raw</i>")).toBe(
        "<p><strong>Bold</strong> and <i>raw</i></p>\n",
      );
    });

    it("turns a single line break into <br>", () => {
      expect(renderMarkdown("one\ntwo")).toContain("<br>");
    });
  });

  describe("parseEntry", () => {
    const job = `---
title: Software Engineer
organization: Tricode
organizationUrl: https://www.tricode.nl/
location: Veenendaal, NL
printHidden: true
start: 2009-08-01
end: 2010-11-01
---

Part of an **Agile** team.`;

    it("reads the front matter and renders the body", () => {
      expect(parseEntry("work", "/src/content/work/2009-tricode.md", job)).toEqual({
        id: "2009-tricode",
        kind: "work",
        title: "Software Engineer",
        start: "2009-08-01",
        end: "2010-11-01",
        organization: "Tricode",
        organizationUrl: "https://www.tricode.nl/",
        location: "Veenendaal, NL",
        printHidden: true,
        html: "<p>Part of an <strong>Agile</strong> team.</p>\n",
      });
    });

    it("leaves out what the entry does not say", () => {
      const entry = parseEntry(
        "work",
        "/src/content/work/x.md",
        "---\ntitle: T\nstart: 2021-03-20\n---\n",
      );
      expect(entry).toEqual({
        id: "x",
        kind: "work",
        title: "T",
        start: "2021-03-20",
        printHidden: false,
        html: "",
      });
      expect("end" in entry).toBe(false);
    });

    it("names the file when the title is missing", () => {
      expect(() =>
        parseEntry("work", "/src/content/work/x.md", "---\nstart: 2021-03-20\n---\n"),
      ).toThrow('/src/content/work/x.md: the front matter needs a "title"');
    });

    it("rejects a date that is not yyyy-MM-dd", () => {
      expect(() =>
        parseEntry("work", "/src/content/work/x.md", "---\ntitle: T\nstart: March 2021\n---\n"),
      ).toThrow('"start" must be a yyyy-MM-dd date');
    });
  });

  describe("parsePage", () => {
    it("reads the heading and renders the body", () => {
      expect(parsePage("/src/content/introduction.md", "---\ntitle: About Me\n---\nHello")).toEqual(
        {
          title: "About Me",
          html: "<p>Hello</p>\n",
        },
      );
    });
  });

  describe("buildResume", () => {
    const entry = (title: string, start: string) => `---\ntitle: ${title}\nstart: ${start}\n---\n`;
    const sources = (): Record<string, string> => ({
      "/src/content/introduction.md": "---\ntitle: About Me\n---\nHi",
      "/src/content/gap-year.md": "---\ntitle: Gap Year\n---\nTravel",
      "/src/content/work/2009-a.md": entry("Old job", "2009-08-01"),
      "/src/content/work/2021-b.md": entry("New job", "2021-09-01"),
      "/src/content/education/2003-c.md": entry("Degree", "2003-03-01"),
    });

    it("sorts each kind of entry from newest to oldest", () => {
      const { entries } = buildResume(sources());
      expect(entries.work.map((item) => item.title)).toEqual(["New job", "Old job"]);
      expect(entries.education.map((item) => item.title)).toEqual(["Degree"]);
      expect(entries.apps).toEqual([]);
    });

    it("finds the introduction and the gap year", () => {
      const { introduction, gapYear } = buildResume(sources());
      expect(introduction.title).toBe("About Me");
      expect(gapYear.title).toBe("Gap Year");
    });

    it("fails when a page is missing", () => {
      const { "/src/content/gap-year.md": _gone, ...rest } = sources();
      expect(() => buildResume(rest)).toThrow("src/content needs introduction.md and gap-year.md");
    });
  });
  describe("the files in src/content", () => {
    let resume: ReturnType<typeof buildResume> | undefined;

    beforeAll(async () => {
      resume = buildResume(await loadContentSources());
    });

    it("all parse, with the front matter they need", () => {
      const counts = Object.values(resume?.entries ?? {}).map((entries) => entries.length);
      expect(counts).toEqual([7, 2, 2, 4]);
    });

    it("end after they start", () => {
      for (const entry of Object.values(resume?.entries ?? {}).flat()) {
        if (entry.end !== undefined) {
          expect(entry.end >= entry.start, entry.id).toBe(true);
        }
      }
    });

    it("render to HTML without leftover Markdown", () => {
      for (const entry of Object.values(resume?.entries ?? {}).flat()) {
        expect(entry.html, entry.id).not.toMatch(/\*\*|^#{1,6} /m);
      }
      expect(resume?.gapYear.html).not.toMatch(/\*\*|^#{1,6} /m);
    });
  });
});
