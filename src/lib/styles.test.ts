/** Writing styles: the same résumé, worded differently. */
import { describe, expect, it } from "bun:test";
import { buildResume, buildStyle } from "./content.ts";
import { applyStyle, entryKey, fetchStyle, type StyledResume } from "./styles.ts";

describe("styles", () => {
  const sources = {
    "/src/content/introduction.md": "---\ntitle: About Me\n---\n\nI am an engineer.",
    "/src/content/gap-year.md": "---\ntitle: Gap Year\n---\n\nI travelled.",
    "/src/content/work/2017-talkdesk.md":
      "---\ntitle: Frontend Engineer\norganization: Talkdesk\nstart: 2017-04-01\n---\n\nBuilt **React** charts.",
    "/src/content/education/2003-unb.md":
      "---\ntitle: Bachelor of Computer Science\nstart: 2003-03-01\n---\n",
  };
  const resume = buildResume(sources);

  const yoda = {
    "/src/content/styles/yoda/introduction.md": "An engineer, I am.",
    "/src/content/styles/yoda/gap-year.md": "Travelled, I have.",
    "/src/content/styles/yoda/work/2017-talkdesk.md": "Charts with **React**, built I did.",
  };

  describe("buildStyle", () => {
    it("reads the text of the introduction, the gap year and every entry that has one", () => {
      const style = buildStyle(resume, "yoda", yoda);
      expect(style.introduction.markdown).toBe("An engineer, I am.");
      expect(style.introduction.html).toBe("<p>An engineer, I am.</p>\n");
      expect(style.gapYear.markdown).toBe("Travelled, I have.");
      expect(Object.keys(style.entries)).toEqual(["work/2017-talkdesk"]);
      expect(style.entries["work/2017-talkdesk"]?.html).toContain("<strong>React</strong>");
    });

    it("leaves the files of other styles alone", () => {
      const style = buildStyle(resume, "yoda", {
        ...yoda,
        "/src/content/styles/shrek/introduction.md": "Ogres have layers.",
      });
      expect(style.introduction.markdown).toBe("An engineer, I am.");
    });

    it("fails when a page or an entry has no text", () => {
      const { "/src/content/styles/yoda/gap-year.md": _gone, ...rest } = yoda;
      expect(() => buildStyle(resume, "yoda", rest)).toThrow('the "yoda" style needs gap-year.md');
      const { "/src/content/styles/yoda/work/2017-talkdesk.md": _job, ...noJob } = yoda;
      expect(() => buildStyle(resume, "yoda", noJob)).toThrow(
        'the "yoda" style needs work/2017-talkdesk.md',
      );
    });

    it("fails on a text that matches nothing in the résumé", () => {
      expect(() =>
        buildStyle(resume, "yoda", {
          ...yoda,
          "/src/content/styles/yoda/work/2020-nowhere.md": "x",
        }),
      ).toThrow('the "yoda" style has work/2020-nowhere.md, which matches nothing in the résumé');
    });

    it("does not ask for a text of an entry that has none", () => {
      expect(Object.keys(buildStyle(resume, "yoda", yoda).entries)).not.toContain(
        "education/2003-unb",
      );
    });
  });

  describe("applyStyle", () => {
    const style: StyledResume = buildStyle(resume, "yoda", yoda);
    const restyled = applyStyle(resume, style);

    it("puts the text of the style in place of the original's", () => {
      expect(restyled.introduction.html).toBe("<p>An engineer, I am.</p>\n");
      expect(restyled.gapYear.markdown).toBe("Travelled, I have.");
      expect(restyled.entries.work[0]?.markdown).toBe("Charts with **React**, built I did.");
    });

    it("keeps everything that is not text", () => {
      expect(restyled.introduction.title).toBe("About Me");
      expect(restyled.entries.work[0]).toMatchObject({
        id: "2017-talkdesk",
        title: "Frontend Engineer",
        organization: "Talkdesk",
        start: "2017-04-01",
      });
      expect(restyled.entries.education).toEqual(resume.entries.education);
    });

    it("keeps the original text of an entry the style does not mention", () => {
      const sparse = applyStyle(resume, { ...style, entries: {} });
      expect(sparse.entries.work).toEqual(resume.entries.work);
    });

    it("leaves the original résumé as it was", () => {
      expect(resume.introduction.markdown).toBe("I am an engineer.");
    });
  });

  describe("entryKey", () => {
    it("names where the text of an entry sits in a style", () => {
      expect(entryKey({ kind: "work", id: "2017-talkdesk" })).toBe("work/2017-talkdesk");
    });
  });

  describe("fetchStyle", () => {
    const style = buildStyle(resume, "yoda", yoda);

    it("reads the JSON the build wrote", async () => {
      const fetcher = (() => Promise.resolve(Response.json(style))) as unknown as typeof fetch;
      expect(await fetchStyle("./styles/yoda.json", fetcher)).toEqual(style);
    });

    it("fails when the file is not there", async () => {
      const fetcher = (() =>
        Promise.resolve(
          new Response("", { status: 404, statusText: "Not Found" }),
        )) as unknown as typeof fetch;
      await expect(fetchStyle("./styles/nope.json", fetcher)).rejects.toThrow(
        "./styles/nope.json: 404 Not Found",
      );
    });
  });
});
