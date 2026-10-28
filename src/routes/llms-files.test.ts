/** The two files the site serves for language models, as the routes produce them. */
import { describe, expect, it } from "bun:test";
import { llmsTxtProblems } from "../../test/support/llms.ts";
import { site } from "#lib/data/site.ts";
import { GET as getMarkdown } from "./index.html.md/+server.ts";
import { GET as getLlmsTxt } from "./llms.txt/+server.ts";

// A route handler takes the request event, which these two do not read.
const call = (handler: (event: never) => Response | Promise<Response>) => handler({} as never);

describe("the files for language models", () => {
  describe("llms.txt", () => {
    it("is plain text", async () => {
      const response = await call(getLlmsTxt);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    });

    it("follows the llms.txt format, and points at the page's own address", async () => {
      const text = await (await call(getLlmsTxt)).text();
      expect(llmsTxtProblems(text)).toEqual([]);
      expect(text).toContain(`(${site.url}index.html.md)`);
    });
  });

  describe("index.html.md", () => {
    it("is Markdown", async () => {
      const response = await call(getMarkdown);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    });

    it("is the whole résumé", async () => {
      const text = await (await call(getMarkdown)).text();
      expect(text).toStartWith("# William R. J. Ribeiro\n");
      expect(text).toContain("## Work Experience");
      expect(text).toContain("### Principal Software Engineer, Hala Systems Inc.");
    });
  });
});
