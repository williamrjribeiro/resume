import { join } from "node:path";

const root = join(import.meta.dir, "../..");

/** Reads every file that matches `pattern` (relative to the repository), keyed as `import.meta.glob` keys them. */
async function readGlob(pattern: string): Promise<Record<string, string>> {
  const sources: Record<string, string> = {};
  for await (const path of new Bun.Glob(pattern).scan({ cwd: root })) {
    sources[`/${path}`] = await Bun.file(join(root, path)).text();
  }
  return sources;
}

/** The Markdown files of the résumé, as Vite hands them to `src/lib/server/resume.ts`. */
export function loadContentSources(): Promise<Record<string, string>> {
  return readGlob("src/content/**/*.md");
}

/** The SVG files in src/assets/icons, as Vite hands them to `src/lib/icon-lookup.ts`. */
export function loadIconSources(): Promise<Record<string, string>> {
  return readGlob("src/assets/icons/*.svg");
}
