import type { Author } from "./data/author.ts";

/** The `<script type="application/ld+json">` element that describes the page to search engines. */
export function jsonLdScript(author: Author, pageUrl: string, imageUrl: string): string {
  const place = `${author.locality}, ${author.country}`;
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: pageUrl,
    name: author.name,
    mainEntity: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.occupation,
      description: `${author.occupation} in ${place}`,
      image: imageUrl,
      url: pageUrl,
      sameAs: author.social.map((social) => social.url),
    },
    // `<` is escaped so that no text in the data can close the script element.
  }).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}
