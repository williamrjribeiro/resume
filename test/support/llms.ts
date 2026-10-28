/** What is wrong with a `llms.txt` according to https://llmstxt.org; empty when it follows the format. */
export function llmsTxtProblems(text: string): ReadonlyArray<string> {
  const problems: Array<string> = [];
  const lines = text.split("\n");
  const firstLine = lines.findIndex((line) => line.trim() !== "");

  if (!lines[firstLine]?.startsWith("# ")) problems.push("it does not start with an H1");
  if (lines.filter((line) => line.startsWith("# ")).length !== 1)
    problems.push("it needs exactly one H1");

  const afterTitle = lines.slice(firstLine + 1).find((line) => line.trim() !== "");
  if (!afterTitle?.startsWith("> "))
    problems.push("the H1 is not followed by a blockquote summary");

  const firstSection = lines.findIndex((line) => line.startsWith("## "));
  if (firstSection === -1) problems.push("it has no H2 section");
  const intro = lines.slice(firstLine + 1, firstSection === -1 ? undefined : firstSection);
  if (intro.some((line) => /^#{1,6} /.test(line))) {
    problems.push("the text before the first H2 has a heading");
  }

  const sections = text.split(/^## /m).slice(1);
  const names = sections.map((section) => section.split("\n")[0]);
  if (names.includes("Optional") && names.at(-1) !== "Optional") {
    problems.push("the Optional section is not the last");
  }
  for (const section of sections) {
    const [name, ...body] = section.split("\n");
    for (const line of body.filter((value) => value.trim() !== "")) {
      if (!/^- \[(?:\\.|[^\]\\])+\]\(https?:\/\/[^)\s]+\)(: .+)?$/.test(line)) {
        problems.push(`"${name}" has a line that is not a link item: ${line}`);
      }
    }
  }
  return problems;
}
