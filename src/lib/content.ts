import { marked } from "marked";
import { parse as parseYaml } from "yaml";
import { entryKey, type StyledResume, type StyledText } from "./styles.ts";

export const entryKinds = ["work", "apps", "education", "volunteering"] as const;
export type EntryKind = (typeof entryKinds)[number];

/** A dated line of the résumé: a job, a degree, an app or a volunteering stint. */
export interface Entry {
  readonly id: string;
  readonly kind: EntryKind;
  readonly title: string;
  /** `yyyy-MM-dd` */
  readonly start: string;
  /** `yyyy-MM-dd`; absent while the entry is still going on. */
  readonly end?: string;
  readonly organization?: string;
  readonly organizationUrl?: string;
  readonly location?: string;
  readonly sourceCodeUrl?: string;
  readonly storeUrl?: string;
  /** Left out of the printed résumé. */
  readonly printHidden: boolean;
  /** The Markdown body as written. Empty when the entry has none. */
  readonly markdown: string;
  /** The Markdown body, rendered. Empty when the entry has none. */
  readonly html: string;
}

/** A free-form block of Markdown with a heading, such as "About Me". */
export interface Page {
  readonly title: string;
  readonly markdown: string;
  readonly html: string;
}

export interface Resume {
  readonly introduction: Page;
  readonly gapYear: Page;
  readonly entries: Readonly<Record<EntryKind, ReadonlyArray<Entry>>>;
}

type Frontmatter = Readonly<Record<string, unknown>>;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = FRONTMATTER.exec(raw);
  if (match === null) {
    return { data: {}, body: raw };
  }
  const data: unknown = parseYaml(match[1] ?? "");
  const isRecord = typeof data === "object" && data !== null && !Array.isArray(data);
  return { data: isRecord ? (data as Frontmatter) : {}, body: raw.slice(match[0].length) };
}

export function renderMarkdown(body: string): string {
  return marked.parse(body, { async: false, gfm: true, breaks: true });
}

function optionalText(data: Frontmatter, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function requiredText(data: Frontmatter, key: string, path: string): string {
  const value = optionalText(data, key);
  if (value === undefined) {
    throw new Error(`${path}: the front matter needs a "${key}"`);
  }
  return value;
}

function requiredDate(data: Frontmatter, key: string, path: string): string {
  const value = requiredText(data, key, path);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${path}: "${key}" must be a yyyy-MM-dd date, got "${value}"`);
  }
  return value;
}

/** `/src/content/work/2017-talkdesk.md` → `2017-talkdesk` */
function idOf(path: string): string {
  return (path.split("/").pop() ?? path).replace(/\.md$/, "");
}

export function parseEntry(kind: EntryKind, path: string, raw: string): Entry {
  const { data, body } = splitFrontmatter(raw);
  const end = optionalText(data, "end");
  const organization = optionalText(data, "organization");
  const organizationUrl = optionalText(data, "organizationUrl");
  const location = optionalText(data, "location");
  const sourceCodeUrl = optionalText(data, "sourceCodeUrl");
  const storeUrl = optionalText(data, "storeUrl");
  return {
    id: idOf(path),
    kind,
    title: requiredText(data, "title", path),
    start: requiredDate(data, "start", path),
    ...(end === undefined ? {} : { end: requiredDate(data, "end", path) }),
    ...(organization === undefined ? {} : { organization }),
    ...(organizationUrl === undefined ? {} : { organizationUrl }),
    ...(location === undefined ? {} : { location }),
    ...(sourceCodeUrl === undefined ? {} : { sourceCodeUrl }),
    ...(storeUrl === undefined ? {} : { storeUrl }),
    printHidden: data["printHidden"] === true,
    markdown: body.trim(),
    html: renderMarkdown(body),
  };
}

export function parsePage(path: string, raw: string): Page {
  const { data, body } = splitFrontmatter(raw);
  return {
    title: requiredText(data, "title", path),
    markdown: body.trim(),
    html: renderMarkdown(body),
  };
}

/** Newest first. */
function byStartDescending(a: Entry, b: Entry): number {
  return b.start.localeCompare(a.start);
}

/**
 * Builds the résumé from Markdown sources keyed by path, as `import.meta.glob` returns them:
 * `/src/content/work/2017-talkdesk.md`, `/src/content/introduction.md`, ...
 */
export function buildResume(sources: Readonly<Record<string, string>>): Resume {
  const entries: Record<EntryKind, Array<Entry>> = {
    work: [],
    apps: [],
    education: [],
    volunteering: [],
  };
  const pages: Record<string, Page> = {};

  for (const [path, raw] of Object.entries(sources)) {
    const kind = entryKinds.find((candidate) => path.includes(`/content/${candidate}/`));
    if (kind === undefined) {
      pages[idOf(path)] = parsePage(path, raw);
    } else {
      entries[kind].push(parseEntry(kind, path, raw));
    }
  }

  const introduction = pages["introduction"];
  const gapYear = pages["gap-year"];
  if (introduction === undefined || gapYear === undefined) {
    throw new Error("src/content needs introduction.md and gap-year.md");
  }
  for (const list of Object.values(entries)) {
    list.sort(byStartDescending);
  }
  return { introduction, gapYear, entries };
}

/**
 * Builds the text of one writing style from Markdown sources keyed by path, as `import.meta.glob` returns them:
 * `/src/content/styles/yoda/introduction.md`, `/src/content/styles/yoda/work/2017-talkdesk.md`, ...
 * A style has a file for the introduction, the gap year and every entry that has a text, and for nothing else.
 */
export function buildStyle(
  resume: Resume,
  id: string,
  sources: Readonly<Record<string, string>>,
): StyledResume {
  const prefix = `/src/content/styles/${id}/`;
  const texts = new Map<string, StyledText>();
  for (const [path, raw] of Object.entries(sources)) {
    if (path.startsWith(prefix)) {
      const { body } = splitFrontmatter(raw);
      texts.set(path.slice(prefix.length).replace(/\.md$/, ""), {
        markdown: body.trim(),
        html: renderMarkdown(body),
      });
    }
  }

  const take = (key: string): StyledText => {
    const text = texts.get(key);
    if (text === undefined) {
      throw new Error(`the "${id}" style needs ${key}.md`);
    }
    texts.delete(key);
    return text;
  };

  const introduction = take("introduction");
  const gapYear = take("gap-year");
  const entries: Record<string, StyledText> = {};
  for (const entry of Object.values(resume.entries).flat()) {
    if (entry.markdown !== "") {
      const key = entryKey(entry);
      entries[key] = take(key);
    }
  }
  for (const key of texts.keys()) {
    throw new Error(`the "${id}" style has ${key}.md, which matches nothing in the résumé`);
  }
  return { introduction, gapYear, entries };
}

/** The text of each of the styles `ids`, keyed by id. */
export function buildStyles(
  resume: Resume,
  ids: ReadonlyArray<string>,
  sources: Readonly<Record<string, string>>,
): Readonly<Record<string, StyledResume>> {
  return Object.fromEntries(ids.map((id) => [id, buildStyle(resume, id, sources)]));
}
