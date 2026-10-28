import { mf2 } from "microformats-parser";
import { site } from "../../src/lib/data/site.ts";

/** What a microformats2 parser finds in markup that is served at the site's URL. */
export function parseMicroformats(html: string) {
  return mf2(html, { baseUrl: site.url });
}
