/** What the page puts in its <head>: title, description, social cards, icons and structured data. */
import { describe, expect, it } from "bun:test";
import { renderComponent } from "../../../test/support/render.ts";
import { author } from "#lib/data/author.ts";
import { site } from "#lib/data/site.ts";
import Head from "./Head.svelte";

describe("Head", () => {
  const { head } = renderComponent(Head, {});
  const meta = (attribute: "name" | "property", key: string) =>
    new RegExp(`<meta ${attribute}="${key}" content="([^"]*)"`).exec(head)?.[1];

  it("has one descriptive title", () => {
    expect(head.match(/<title>/g)).toHaveLength(1);
    expect(head).toContain(`<title>${author.name} - ${author.occupation} in Lisbon, PT</title>`);
  });

  it("has a description and a canonical address", () => {
    expect(meta("name", "description")).toBe(`Online Resume of ${author.name}`);
    expect(head).toContain(`<link rel="canonical" href="${site.url}"`);
  });

  it("describes the page to social networks, with an absolute image address", () => {
    expect(meta("property", "og:type")).toBe("profile");
    expect(meta("property", "og:url")).toBe(site.url);
    expect(meta("property", "og:image")).toBe(`${site.url}images/avatar.jpg`);
  });

  it("links the icons and the manifest relative to the page, so that the base path does not matter", () => {
    expect(head).toContain('href="./favicon/favicon-32x32.png"');
    expect(head).toContain('href="./site.webmanifest"');
  });

  it("points agents at the Markdown résumé and at llms.txt", () => {
    expect(head).toContain('<link rel="alternate" type="text/markdown" href="./index.html.md"');
    expect(head).toContain('<link rel="describedby" href="./llms.txt"');
  });

  it("has the theme colour", () => {
    expect(meta("name", "theme-color")).toBe(site.colors.primary);
  });

  it("has structured data about the person", () => {
    const json = /<script type="application\/ld\+json">([^]*?)<\/script>/.exec(head)?.[1] ?? "";
    expect(JSON.parse(json)).toMatchObject({
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: author.name,
        sameAs: author.social.map((social) => social.url),
      },
    });
  });
});
