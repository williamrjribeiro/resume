import { author } from "#lib/data/author.ts";
import { site } from "#lib/data/site.ts";
import { buildResumeMarkdown } from "#lib/llms.ts";
import { resume } from "#lib/server/resume.ts";
import type { RequestHandler } from "./$types";

// The Markdown copy of the page at /, named the way llmstxt.org names it. Written to index.html.md
// when the site is prerendered.
export const prerender = true;

export const GET: RequestHandler = () =>
  new Response(buildResumeMarkdown({ resume, author, siteUrl: site.url }), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
