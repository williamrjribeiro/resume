/** Looking up the inline SVG icons in src/assets/icons. */
import { beforeAll, describe, expect, it } from "bun:test";
import { loadIconSources } from "../../test/support/files.ts";
import { author } from "#lib/data/author.ts";
import { createIconLookup } from "./icons.ts";

describe("icons", () => {
  describe("createIconLookup", () => {
    const lookup = createIconLookup({
      "/src/assets/icons/github.svg": '<svg viewBox="0 0 24 24"><path d="M0"/></svg>',
    });

    it("finds an icon by its file name", () => {
      expect(lookup("github")).toContain('<path d="M0"/>');
    });

    it("ignores case and spaces in the name", () => {
      expect(lookup("GitHub")).toBe(lookup("github"));
      expect(lookup("Git Hub")).toBe(lookup("github"));
    });

    it("hides the icon from assistive technology and colours it like the text", () => {
      expect(lookup("github")).toStartWith('<svg class="');
      expect(lookup("github")).toContain('aria-hidden="true" focusable="false" viewBox');
      expect(lookup("github")).toContain("fill-current");
    });

    it("finds nothing for an unknown name", () => {
      expect(lookup("myspace")).toBeUndefined();
    });
  });

  describe("the icons of the site", () => {
    let lookup: (name: string) => string | undefined = () => undefined;

    beforeAll(async () => {
      lookup = createIconLookup(await loadIconSources());
    });

    it.each(["email", "telephone", "laptop", "print"])("has the %s icon the page uses", (name) => {
      expect(lookup(name)).toBeDefined();
    });

    it("has an icon for every social profile of the author", () => {
      for (const social of author.social) {
        expect(lookup(social.name), social.name).toBeDefined();
      }
    });
  });
});
