/** The header: the page's h-card (https://microformats.org/wiki/h-card). */
import { describe, expect, it } from "bun:test";
import { parseMicroformats } from "../../../test/support/microformats.ts";
import { renderComponent } from "../../../test/support/render.ts";
import { checkHCard } from "../../../scripts/check-microformats.ts";
import { author } from "#lib/data/author.ts";
import { site } from "#lib/data/site.ts";
import HCard from "./HCard.svelte";

describe("HCard", () => {
  const { body } = renderComponent(HCard, {});
  const { items, rels } = parseMicroformats(body);
  const [card] = items;

  it("is a complete h-card for the page", () => {
    expect(checkHCard(body, site.url)).toEqual([]);
  });

  it("names the person", () => {
    expect(card?.properties["name"]).toEqual([author.name]);
    expect(card?.properties["job-title"]).toEqual([author.occupation]);
    expect(card?.properties["gender-identity"]).toEqual([`(${author.pronouns})`]);
  });

  it("gives the locality and the country as an address", () => {
    const [adr] = card?.properties["adr"] ?? [];
    expect(adr).toMatchObject({
      type: ["h-adr"],
      properties: { locality: [author.locality], "country-name": [author.countryName] },
    });
  });

  it("has a photo with a text alternative", () => {
    expect(card?.properties["photo"]).toEqual([
      { value: new URL("images/avatar.jpg", site.url).href, alt: author.name },
    ]);
  });

  it("offers the photo as WebP, with the JPEG as the fallback that parsers read", () => {
    expect(body).toMatch(
      /<picture[^>]*><source srcset="\.\/images\/avatar\.webp" type="image\/webp"[^>]*>\s*<img [^>]*src="\.\/images\/avatar\.jpg"/,
    );
    expect(card?.properties["photo"]).toEqual([
      { value: new URL("images/avatar.jpg", site.url).href, alt: author.name },
    ]);
  });

  it("links the website, which is also the card's uid", () => {
    expect(card?.properties["uid"]).toEqual([site.url]);
    expect(card?.properties["url"]).toContain(site.url);
  });

  it("lists every social profile as a rel=me link with its nickname", () => {
    expect(rels["me"]).toEqual(author.social.map((social) => social.url));
    expect(card?.properties["nickname"]).toEqual(author.social.map((social) => social.user));
  });

  it("spells the email address as HTML entities, not as plain text", () => {
    expect(body).not.toContain(author.email);
    expect(card?.properties["email"]).toEqual([`mailto:${author.email}`]);
  });

  it("dials the telephone number without its spaces", () => {
    expect(body).toContain('href="tel:+351912856244"');
  });

  it("scrolls to the top from a named button", () => {
    expect(body).toContain('<button type="button" aria-label="Scroll to top"');
  });
});
