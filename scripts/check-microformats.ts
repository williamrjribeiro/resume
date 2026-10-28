/**
 * Checks that a built page carries the author's h-card (https://microformats.org/wiki/h-card), which
 * is the point of the site's markup. CI runs it on the build before deploying:
 *
 *   bun scripts/check-microformats.ts [build/index.html] [https://example.com/resume/]
 */
import { mf2 } from "microformats-parser";

const REQUIRED = ["name", "photo", "job-title", "email", "tel", "url", "uid"] as const;

/** What is wrong with the page's h-card; empty when it is fine. */
export function checkHCard(html: string, pageUrl: string): ReadonlyArray<string> {
  const { items } = mf2(html, { baseUrl: pageUrl });
  const card = items.find((item) => item.type?.includes("h-card"));
  if (card === undefined) {
    return ["there is no top-level h-card"];
  }
  const problems = REQUIRED.filter(
    (property) => (card.properties[property] ?? []).length === 0,
  ).map((property) => `the h-card has no ${property}`);
  const uids = card.properties["uid"] ?? [];
  if (uids.length > 0 && !uids.includes(pageUrl)) {
    problems.push(`the h-card's uid is not the page URL ${pageUrl}`);
  }
  return problems;
}

if (import.meta.main) {
  const [file = "build/index.html", pageUrl = "https://williamrjribeiro.github.io/resume/"] =
    Bun.argv.slice(2);
  const problems = checkHCard(await Bun.file(file).text(), pageUrl);
  if (problems.length > 0) {
    console.error(`${file}:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`${file}: the h-card is complete`);
}
