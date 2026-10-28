/** The structured data that describes the page to search engines. */
import { describe, expect, it } from "bun:test";
import type { Author } from "./data/author.ts";
import { jsonLdScript } from "./json-ld.ts";

describe("json-ld", () => {
  describe("jsonLdScript", () => {
    const author: Author = {
      name: "Jane </script> Doe",
      occupation: "Engineer",
      locality: "Lisbon",
      country: "PT",
      countryName: "Portugal",
      pronouns: "she/her",
      email: "jane@example.com",
      telephone: "+1 555 0100",
      website: "https://example.com/",
      skills: [],
      languages: [],
      social: [{ name: "Github", user: "jane", url: "https://github.com/jane" }],
    };
    const html = jsonLdScript(author, "https://example.com/", "https://example.com/me.jpg");
    const json = html
      .replace(/^<script type="application\/ld\+json">/, "")
      .replace(/<\/script>$/, "");

    it("describes a person on a profile page", () => {
      expect(JSON.parse(json)).toMatchObject({
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          jobTitle: "Engineer",
          image: "https://example.com/me.jpg",
          sameAs: ["https://github.com/jane"],
        },
      });
    });

    it("cannot be closed early by text in the data", () => {
      expect(json).not.toContain("</script>");
      expect(JSON.parse(json).name).toBe("Jane </script> Doe");
    });
  });
});
