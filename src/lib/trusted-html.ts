/** The name of the Trusted Types policy for the résumé's text. The Content Security Policy in vite.config.ts lists it. */
export const trustedHtmlPolicyName = "resume-content";

/** What `window.trustedTypes` offers, as far as this needs. */
export interface TrustedTypesFactory {
  createPolicy(
    name: string,
    rules: { createHTML(html: string): string },
  ): { createHTML(html: string): unknown };
}

/**
 * Makes the function that marks the résumé's HTML as trusted. The page's Content Security Policy requires
 * Trusted Types, so a string given to `{@html}` is refused when it is put in the page by the browser: that is
 * what happens when the visitor picks a writing style, whose HTML is downloaded and swapped in. Hydrating the
 * HTML the build wrote needs no policy, which is why only the swap fails without it.
 *
 * The HTML is the build's own output (src/content, rendered by `marked` and served from this site), so the
 * policy passes it on as it is. Without Trusted Types (the server, older browsers, the dev server) the HTML stays a
 * string. A browser that already has a policy of that name refuses a second one; the HTML then stays a string
 * too, and the browser's own rules decide.
 */
export function createTrustedHtml(
  factory: TrustedTypesFactory | undefined,
): (html: string) => string {
  if (factory === undefined) {
    return (html) => html;
  }
  try {
    const policy = factory.createPolicy(trustedHtmlPolicyName, { createHTML: (html) => html });
    // In the browser this is a TrustedHTML object, not a string. `{@html}` assigns it to `innerHTML` as it is,
    // and turning it into a string would make the browser refuse it again, so it is typed as the string it
    // stands for.
    return (html) => policy.createHTML(html) as string;
  } catch {
    return (html) => html;
  }
}

/** Marks HTML from the résumé's own files as trusted, for `{@html}`. */
export const trustedHtml = createTrustedHtml(
  (globalThis as { trustedTypes?: TrustedTypesFactory }).trustedTypes,
);
