import type { Entry, Page, Resume } from "./content.ts";

/** A way of writing the résumé, such as "Yoda". */
export interface WritingStyle {
  readonly id: string;
  readonly label: string;
}

/** The résumé as it is written in `src/content`. It is what the page shows first. */
export const originalStyle: WritingStyle = { id: "original", label: "Original" };

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
