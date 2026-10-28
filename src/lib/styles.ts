import type { Entry, Page, Resume } from "./content.ts";

/**
 * The colours of the page, as the reviewed parts of a character: a few colours that make it recognizable, and
 * the dark and light tones that carry the text. Each one replaces a CSS variable, see `src/lib/theme.ts`.
 */
export interface Theme {
  /** Links and small headings. Needs 4.5:1 on `paper`, and white text on it 4.5:1. */
  readonly primary: string;
  /** The focus outline, and markers. Needs 3:1 on `paper`. */
  readonly secondary: string;
  /** Markers and underlines. Decorative, but still has to show on `paper` (1.5:1). */
  readonly accent: string;
  readonly highlight: string;
  /** The stops of the sidebar's moving gradient. Icons on it are white, so each needs 3:1 against white. */
  readonly sidebar: ReadonlyArray<string>;
  /** The background of the page. */
  readonly paper: string;
  /** The background of the footer. */
  readonly tint: string;
  /** The text. Needs 7:1 on `paper` and on `tint`. */
  readonly ink: string;
}

/** A way of writing the résumé, such as "Yoda", with the colours of its character. */
export interface WritingStyle {
  readonly id: string;
  readonly label: string;
  readonly theme: Theme;
}

/** The colours the style sheet starts with. They are `src/styles.css`'s, and a test keeps the two together. */
export const originalTheme: Theme = {
  primary: "#005b96",
  secondary: "#fc6767",
  accent: "#4bc5cf",
  highlight: "#a24bcf",
  sidebar: ["#a24bcf", "#005b96", "#4bc5cf"],
  paper: "#ffffff",
  tint: "#eceeef",
  ink: "#373a3c",
};

/** The résumé as it is written in `src/content`. It is what the page shows first. */
export const originalStyle: WritingStyle = {
  id: "original",
  label: "Original",
  theme: originalTheme,
};

/** One block of Markdown, as written and rendered. */
export interface StyledText {
  readonly markdown: string;
  readonly html: string;
}

/**
 * The text of one writing style: the same pages and entries as the résumé, worded differently. Everything else
 * (dates, organizations, links, the order and the sections) stays with the résumé.
 */
export interface StyledResume {
  readonly introduction: StyledText;
  readonly gapYear: StyledText;
  /** Keyed by `entryKey`; only the entries that have a text of their own. */
  readonly entries: Readonly<Record<string, StyledText>>;
}

/** `work/2017-talkdesk`: where the entry's text sits in a style, next to `introduction` and `gap-year`. */
export function entryKey(entry: Pick<Entry, "kind" | "id">): string {
  return `${entry.kind}/${entry.id}`;
}

function restyled<T extends Page | Entry>(original: T, text: StyledText | undefined): T {
  return text === undefined ? original : { ...original, ...text };
}

/** The résumé with the text of `style` in place of the original's. */
export function applyStyle(resume: Resume, style: StyledResume): Resume {
  const restyleAll = (list: ReadonlyArray<Entry>) =>
    list.map((entry) => restyled(entry, style.entries[entryKey(entry)]));
  return {
    introduction: restyled(resume.introduction, style.introduction),
    gapYear: restyled(resume.gapYear, style.gapYear),
    entries: {
      work: restyleAll(resume.entries.work),
      apps: restyleAll(resume.entries.apps),
      education: restyleAll(resume.entries.education),
      volunteering: restyleAll(resume.entries.volunteering),
    },
  };
}

/** Downloads the text of a style, which the build writes to `styles/<id>.json`. */
export async function fetchStyle(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<StyledResume> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as StyledResume;
}
