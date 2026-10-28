/**
 * The résumé for language models and agents, made from the same data as the web page so that the three
 * cannot drift apart:
 *
 * - `llms.txt` follows https://llmstxt.org: an H1, a one-line summary, some text without headings, and
 *   H2 sections that are lists of links with notes.
 * - `index.html.md` is the whole résumé as Markdown. The spec names it as the clean Markdown copy of the
 *   page served at `/`, which is the address with no file name.
 *
 * Neither has the email address or the telephone number. The web page writes the email address as HTML
 * entities to keep it from scrapers, and files made to be read by crawlers would undo that.
 */
import type { Entry, EntryKind, Resume } from "./content.ts";
import type { Author } from "./data/author.ts";
import { strings } from "./data/site.ts";

export interface LlmsOptions {
  readonly resume: Resume;
  readonly author: Author;
  /** The address of the page, with the trailing slash: `https://example.com/resume/`. */
  readonly siteUrl: string;
}

export const MARKDOWN_RESUME_FILE = "index.html.md";
export const LLMS_FILE = "llms.txt";

/** The sources only use `<b>` and `<i>`, which Markdown spells with asterisks. */
export const inlineHtmlToMarkdown = (markdown: string): string =>
  markdown.replace(/<\/?(?:b|strong)>/g, "**").replace(/<\/?(?:i|em)>/g, "*");

/** `2021-09-01` → `2021-09` */
const month = (date: string): string => date.slice(0, 7);

const period = (entry: Entry): string =>
  `${month(entry.start)} – ${entry.end === undefined ? "present" : month(entry.end)}`;

const escapeLinkText = (text: string): string => text.replace(/[[\]]/g, "\\$&");

const link = (text: string, url: string): string => `[${escapeLinkText(text)}](${url})`;

const place = (author: Author): string => `${author.locality}, ${author.countryName}`;

const joined = (parts: ReadonlyArray<string | undefined>, separator: string): string =>
  parts.filter((part): part is string => part !== undefined && part !== "").join(separator);

/** What an entry is called in a list: "Principal Software Engineer at Hala Systems Inc.". */
const entryName = (entry: Entry): string =>
  entry.organization === undefined ? entry.title : `${entry.title} at ${entry.organization}`;

const entries = (resume: Resume, kind: EntryKind): ReadonlyArray<Entry> => resume.entries[kind];

const bullets = (items: ReadonlyArray<string>): string =>
  items.map((item) => `- ${item}`).join("\n");

/** `llms.txt`: what the site is, and where to read more. */
export const buildLlmsTxt = ({ resume, author, siteUrl }: LlmsOptions): string => {
  const markdownUrl = new URL(MARKDOWN_RESUME_FILE, siteUrl).href;
  /** A link target for an entry: the organization if it has a site, else the full résumé. */
  const target = (entry: Entry): string =>
    entry.organizationUrl ?? entry.sourceCodeUrl ?? entry.storeUrl ?? markdownUrl;
  /** A list item: the entry's link, then what the notes say about it. */
  const listed = (entry: Entry, kind?: string): string =>
    `${link(entryName(entry), target(entry))}: ${joined([kind, period(entry), entry.location], ", ")}.`;

  const education = entries(resume, "education").map(
    (entry) => `${joined([entry.title, entry.organization], ", ")} (${period(entry)})`,
  );

  const sections = [
    `# ${author.name}`,
    `> Online résumé of ${author.name}, ${author.occupation} in ${place(author)}: work experience, indie apps, education and volunteering.`,
    // Text without headings, which is all the spec allows between the summary and the first list.
    inlineHtmlToMarkdown(resume.introduction.markdown),
    bullets([
      `Location: ${place(author)}`,
      `Pronouns: ${author.pronouns}`,
      `Languages: ${author.languages.map((language) => `${language.name} (${language.level})`).join(", ")}`,
      `Skills: ${author.skills.join(", ")}`,
      `Education: ${education.join("; ")}`,
      "Contact: through the profiles below. The email address and the telephone number are on the web page.",
    ]),
    `## Résumé\n${bullets([
      `${link("Résumé in Markdown", markdownUrl)}: every job, app, degree and volunteering role, with dates and descriptions.`,
      `${link("Résumé web page", siteUrl)}: the same résumé as HTML, marked up with the h-card and h-resume microformats.`,
    ])}`,
    `## ${strings.titles.experience}\n${bullets(entries(resume, "work").map((entry) => listed(entry)))}`,
    `## Profiles\n${bullets(author.social.map((social) => `${link(social.name, social.url)}: ${social.user}`))}`,
    `## Optional\n${bullets([
      ...entries(resume, "apps").map((entry) => listed(entry, "Indie app")),
      ...entries(resume, "volunteering").map((entry) => listed(entry, "Volunteering")),
    ])}`,
  ];
  return `${sections.join("\n\n")}\n`;
};

/** The whole résumé as Markdown: the same sections, in the same order, as the web page. */
export const buildResumeMarkdown = ({ resume, author, siteUrl }: LlmsOptions): string => {
  const entryMarkdown = (entry: Entry): string => {
    const links = [
      entry.organizationUrl === undefined || entry.organization === undefined
        ? entry.organization
        : link(entry.organization, entry.organizationUrl),
      entry.location,
      period(entry),
      entry.sourceCodeUrl === undefined
        ? undefined
        : link(strings.labels.sourceCode, entry.sourceCodeUrl),
      entry.storeUrl === undefined ? undefined : link(strings.labels.appStore, entry.storeUrl),
    ];
    return joined(
      [
        `### ${joined([entry.title, entry.organization], ", ")}`,
        joined(links, " · "),
        inlineHtmlToMarkdown(entry.markdown),
      ],
      "\n\n",
    );
  };
  const section = (title: string, kind: EntryKind): string =>
    `## ${title}\n\n${entries(resume, kind).map(entryMarkdown).join("\n\n")}`;

  const header = joined(
    [
      `# ${author.name}`,
      `${author.occupation} · ${place(author)} · ${author.pronouns}`,
      bullets([
        link("Website", siteUrl),
        ...author.social.map((social) => `${link(social.name, social.url)}: ${social.user}`),
      ]),
    ],
    "\n\n",
  );

  return `${joined(
    [
      header,
      `## ${resume.introduction.title}\n\n${inlineHtmlToMarkdown(resume.introduction.markdown)}`,
      section(strings.titles.experience, "work"),
      section(strings.titles.apps, "apps"),
      `## ${strings.titles.skills}\n\n${bullets(author.skills)}`,
      `## ${strings.titles.languages}\n\n${bullets(author.languages.map((language) => `${language.name} (${language.level})`))}`,
      section(strings.titles.education, "education"),
      section(strings.titles.volunteering, "volunteering"),
      `## ${resume.gapYear.title}\n\n${inlineHtmlToMarkdown(resume.gapYear.markdown)}`,
    ],
    "\n\n",
  )}\n`;
};
