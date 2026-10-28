import { author } from "#lib/data/author.ts";
import { site } from "#lib/data/site.ts";
import { buildLlmsTxt } from "#lib/llms.ts";
import { resume } from "#lib/server/resume.ts";
import type { RequestHandler } from "@sveltejs/kit";

// Written to llms.txt when the site is prerendered.
export const prerender = true;

export const GET: RequestHandler = () =>
  new Response(buildLlmsTxt({ resume, author, siteUrl: site.url }), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
