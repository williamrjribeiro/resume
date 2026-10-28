/**
 * After `vite build`: adds the `'unsafe-inline'` fallback to `script-src` in the CSP `<meta>` of every page.
 *
 * Browsers that know about hashes (all of them since 2016) ignore `'unsafe-inline'` once a hash is in the
 * same directive, so the policy stays as strict. Browsers older than that would not run the page without
 * it, which is what the CSP evaluator behind Lighthouse's `csp-xss` audit points out.
 *
 * SvelteKit's `csp` option cannot express this: it adds no hashes to a directive that has
 * `'unsafe-inline'`. So the hashes go in first, and this adds the keyword after.
 *
 *   bun scripts/harden-csp.ts [build]
 */

const CSP_META = /(<meta\s[^>]*http-equiv="content-security-policy"[^>]*\scontent=")([^"]*)(")/i;
const HAS_HASH_OR_NONCE = /'(?:sha(?:256|384|512)|nonce)-/;

/**
 * The policy with `'unsafe-inline'` in `script-src`. Left as it is when that has no hash or nonce, where
 * adding it would let every inline script run, and when it has the keyword already.
 */
export const withUnsafeInlineFallback = (policy: string): string =>
  policy
    .split(";")
    .map((directive) => {
      const trimmed = directive.trim();
      const isScriptSrc = /^script-src\s/.test(trimmed);
      const strict = HAS_HASH_OR_NONCE.test(trimmed) && !trimmed.includes("'unsafe-inline'");
      return isScriptSrc && strict ? `${trimmed} 'unsafe-inline'` : trimmed;
    })
    .join("; ");

/** The page with the fallback in its CSP `<meta>`; a page without one is returned as it is. */
export const hardenHtml = (html: string): string =>
  html.replace(CSP_META, (_match, before: string, policy: string, after: string) => {
    return `${before}${withUnsafeInlineFallback(policy)}${after}`;
  });

if (import.meta.main) {
  const directory = Bun.argv[2] ?? "build";
  let changed = 0;
  for await (const path of new Bun.Glob("**/*.html").scan(directory)) {
    const file = Bun.file(`${directory}/${path}`);
    const html = await file.text();
    const hardened = hardenHtml(html);
    if (hardened !== html) {
      await Bun.write(file, hardened);
      changed += 1;
    }
  }
  console.log(`${directory}: added the script-src fallback to the CSP of ${changed} page(s)`);
}
