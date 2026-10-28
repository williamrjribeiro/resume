/**
 * The writing styles in src/content/styles hold the same résumé in other words. These examples keep them
 * honest: the same files, the same structure, and nothing lost that must not change (names, numbers, links).
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "bun:test";
import { marked } from "marked";
import { loadContentSources, loadStyleSources } from "../../test/support/files.ts";
import { buildResume, splitFrontmatter } from "./content.ts";
import { writingStyles } from "./data/styles.ts";
import { originalStyle } from "./styles.ts";

describe("the writing styles", () => {
  /** Technologies, products, organizations and places that every style spells as the original does. */
  const names = [
    "Apollo",
    "Axios",
    "Babel",
    "Beads",
    "Berlin",
    "Bitbucket",
    "Bootstrap",
    "Brasília",
    "Bun",
    "Claude",
    "Cucumber",
    "Cursor",
    "Cypress",
    "Datadog",
    "Drizzle",
    "Enzyme",
    "Eddisrupt",
    "Explorers",
    "Git",
    "GitHub",
    "Golang",
    "Gulp",
    "Grunt",
    "Hala",
    "Hexkit",
    "Hono",
    "Hotjar",
    "Java",
    "Jenkins",
    "Jest",
    "Kotlin",
    "Lisbon",
    "Mocha",
    "MongoDB",
    "MySQL",
    "PostgreSQL",
    "PrimeFaces",
    "React",
    "Recharts",
    "Redux",
    "Rollup",
    "Sentry",
    "Storybook",
    "Syria",
    "Tailwind",
    "Talkdesk",
    "Terraform",
    "Tessl",
    "Verdant",
    "Vite",
    "Vitest",
    "Webpack",
    "XpandIT",
    "Zod",
  ];

  /** What a style must carry over untouched: links, numbers, acronyms, and names written in camelCase or with a dot. */
  const patterns = [
    /https?:\/\/[^\s)>\]]+/g,
    /\d+(?:[.,]\d+)*%?/g,
    /\b[A-Z]{2,}\b/g,
    /\b\w*[a-z][A-Z]\w*\b/g,
    /\b\w+\.(?:js|pt|md)\b/g,
  ];

  const mustKeep = (original: string): Array<string> => {
    const found = new Set<string>();
    for (const pattern of patterns) {
      for (const [match] of original.matchAll(pattern)) {
        found.add(match);
      }
    }
    for (const name of names) {
      if (original.includes(name)) {
        found.add(name);
      }
    }
    return [...found];
  };

  /** The skeleton of a Markdown text: its blocks, with the depth of each heading and the size of each list. */
  const skeleton = (markdown: string): Array<string> =>
    marked
      .lexer(markdown)
      .filter((token) => token.type !== "space")
      .map((token) => {
        const bold =
          (token.raw.match(/<b>/g)?.length ?? 0) +
          Math.floor((token.raw.match(/\*\*/g)?.length ?? 0) / 2);
        switch (token.type) {
          case "heading":
            return `h${token.depth}`;
          case "list":
            return `list of ${token.items.length}, ${bold} bold`;
          default:
            return `${token.type}, ${bold} bold`;
        }
      });

  const bodyOf = (raw: string) => splitFrontmatter(raw).body.trim();

  let originals: Record<string, string> = {};
  let styleSources: Record<string, string> = {};
  let expectedFiles: Array<string> = [];

  beforeAll(async () => {
    const sources = await loadContentSources();
    styleSources = await loadStyleSources();
    const resume = buildResume(sources);
    // The texts that a style rewrites: the pages, and the entries that have a body.
    originals = {
      introduction: bodyOf(sources["/src/content/introduction.md"] ?? ""),
      "gap-year": bodyOf(sources["/src/content/gap-year.md"] ?? ""),
      ...Object.fromEntries(
        Object.values(resume.entries)
          .flat()
          .filter((entry) => entry.markdown !== "")
          .map((entry) => [`${entry.kind}/${entry.id}`, entry.markdown]),
      ),
    };
    expectedFiles = Object.keys(originals).toSorted();
  });

  describe("the list of styles", () => {
    it("has an id and a label for each, none twice and none the original's", () => {
      const ids = writingStyles.map((style) => style.id);
      const labels = writingStyles.map((style) => style.label);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(labels).size).toBe(labels.length);
      expect(ids).not.toContain(originalStyle.id);
      expect(labels).not.toContain(originalStyle.label);
      for (const style of writingStyles) {
        expect(style.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(style.label.trim()).not.toBe("");
      }
    });

    it("matches the folders in src/content/styles", () => {
      const root = join(import.meta.dir, "../content/styles");
      const folders = existsSync(root)
        ? readdirSync(root, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .toSorted()
        : [];
      expect(folders).toEqual(writingStyles.map((style) => style.id).toSorted());
    });
  });

  describe.each(writingStyles.map((style) => style.id))("%s", (id) => {
    const textsOf = () =>
      Object.fromEntries(
        Object.entries(styleSources)
          .filter(([path]) => path.startsWith(`/src/content/styles/${id}/`))
          .map(([path, raw]) => [
            path.slice(`/src/content/styles/${id}/`.length).replace(/\.md$/, ""),
            raw,
          ]),
      );

    it("has a text for every page and entry, and for nothing else", () => {
      expect(Object.keys(textsOf()).toSorted()).toEqual(expectedFiles);
    });

    it("is plain Markdown, without a header of its own", () => {
      for (const [key, raw] of Object.entries(textsOf())) {
        expect(raw.startsWith("---"), key).toBe(false);
        expect(raw.trim(), key).not.toBe("");
      }
    });

    it("has the same blocks as the original: headings, paragraphs, lists and bold labels", () => {
      const texts = textsOf();
      for (const [key, original] of Object.entries(originals)) {
        expect(skeleton(texts[key] ?? ""), key).toEqual(skeleton(original));
      }
    });

    it("keeps the links, the numbers and the names of technologies, products and places", () => {
      const texts = textsOf();
      for (const [key, original] of Object.entries(originals)) {
        const text = texts[key] ?? "";
        const lost = mustKeep(original).filter((term) => !text.includes(term));
        expect({ key, lost }).toEqual({ key, lost: [] });
      }
    });

    it("has no leftovers of drafting or stray punctuation", () => {
      for (const [key, raw] of Object.entries(textsOf())) {
        expect(raw, key).not.toMatch(/TODO|FIXME|lorem/i);
        for (const line of raw.split("\n")) {
          const text = line.replace(/^\s*-\s+/, "");
          expect(text, `${key}: ${line}`).not.toMatch(/\S {2,}\S| [,.;:!?]|,,|\.\.(?!\.)/);
        }
      }
    });
  });
});
