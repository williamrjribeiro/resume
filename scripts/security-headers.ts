/**
 * The HTTP response headers behind Lighthouse's "Trust and Safety" group, for `static-server.ts`.
 *
 * A static host that cannot set headers (GitHub Pages) can only carry the `<meta>` Content Security
 * Policy that SvelteKit writes into each page (see vite.config.ts). The rest has to be a header:
 *
 * | Lighthouse audit          | What it reads                                         |
 * | ------------------------- | ----------------------------------------------------- |
 * | `csp-xss`                 | a strict CSP: in a header, the `<meta>` earns a note  |
 * | `trusted-types-xss`       | `require-trusted-types-for 'script'` in the CSP       |
 * | `clickjacking-mitigation` | `frame-ancestors` in the CSP header, or X-Frame-Options |
 * | `origin-isolation`        | Cross-Origin-Opener-Policy                            |
 * | `has-hsts`                | Strict-Transport-Security, a year or more             |
 *
 * See docs/security.md.
 */

/** Two years, which is what the HSTS preload list asks for. */
export const HSTS = "max-age=63072000; includeSubDomains; preload";

/** `frame-ancestors` is the one directive a `<meta>` policy cannot carry, so the header adds it. */
const HEADER_ONLY_CSP = "frame-ancestors 'none'";

/**
 * Whether browsers would remember HSTS for this host and then send every `http://` address on it, on
 * every port, to `https://`. They do for `localhost`, which would break the dev server on
 * `http://localhost:5173` for years, and they do not for IP addresses.
 */
export const isLocalhostName = (hostname: string): boolean =>
  hostname === "localhost" || hostname.endsWith(".localhost");

/** The policy of the `<meta http-equiv="content-security-policy">` in a page, if it has one. */
export const cspFromHtml = (html: string): string | undefined => {
  const tag = /<meta\s[^>]*http-equiv="content-security-policy"[^>]*>/i.exec(html)?.[0];
  const content = tag === undefined ? undefined : /\scontent="([^"]*)"/i.exec(tag)?.[1];
  return content?.replaceAll("&quot;", '"').replaceAll("&amp;", "&");
};

export type SecurityHeadersOptions = {
  /** The host the request was made to: `localhost`, `127.0.0.1`, `192.168.1.5`, `box.local`. */
  readonly hostname: string;
  /** The page being served, for its CSP. Leave it out for other files, which have no use for one. */
  readonly html?: string;
};

export const securityHeaders = ({
  hostname,
  html,
}: SecurityHeadersOptions): Readonly<Record<string, string>> => {
  const policy = html === undefined ? undefined : cspFromHtml(html);
  return {
    ...(policy === undefined ? {} : { "content-security-policy": `${policy}; ${HEADER_ONLY_CSP}` }),
    ...(isLocalhostName(hostname) ? {} : { "strict-transport-security": HSTS }),
    "cross-origin-opener-policy": "same-origin",
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  };
};
