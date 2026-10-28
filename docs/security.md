# Security and Lighthouse's Trust and Safety audits

Lighthouse's best practices category has a **Trust and Safety** section. Five of its audits are
informative: they score 1 whatever the page does, but they list findings, each of high severity, until the
page is hardened. `bun run lighthouse` fails on any finding.

| Audit | What clears it | Where it is set |
| --- | --- | --- |
| `csp-xss` | A strict CSP with no script bypass, in an HTTP header (a `<meta>` policy alone earns a note) | `vite.config.ts` (`csp`), `scripts/harden-csp.ts`, `scripts/security-headers.ts` |
| `trusted-types-xss` | `require-trusted-types-for 'script'` in the CSP, in a header or a `<meta>` | `vite.config.ts` |
| `clickjacking-mitigation` | `frame-ancestors` in the CSP **header**, or `X-Frame-Options` | `scripts/security-headers.ts` |
| `origin-isolation` | `Cross-Origin-Opener-Policy` header | `scripts/security-headers.ts` |
| `has-hsts` | `Strict-Transport-Security` header, with `max-age` of a year or more, `includeSubDomains` and `preload` | `scripts/security-headers.ts` |

`is-on-https`, `geolocation-on-start` and `notification-on-start` pass without any work.

## What the build does

- **The CSP.** `vite.config.ts` gives SvelteKit a policy that allows nothing but this site's own files
  (`default-src 'none'`, then `'self'` for scripts, styles, images, fonts and the manifest). SvelteKit adds
  the hashes of the one inline script and the one inline style it writes into each page, and puts the
  policy in a `<meta>` tag, which works on any host. It applies to `vite build` only: the dev server injects
  inline scripts of its own.
- **Trusted Types.** The policy says strings may reach DOM script sinks only through two policies:
  `svelte-trusted-html`, which Svelte creates for the HTML it builds from its templates, and
  `resume-content` ([src/lib/trusted-html.ts](../src/lib/trusted-html.ts)), for the résumé's text. A writing
  style's HTML is downloaded and swapped in with `{@html}`, which sets `innerHTML`, and the browser refuses
  that for a plain string. Every `{@html}` of the résumé's text goes through `trustedHtml`.
- **The fallback.** After the build, `scripts/harden-csp.ts` adds `'unsafe-inline'` to `script-src`. Browsers
  that know hashes ignore it, as long as a hash is in the same directive; browsers too old to know them would
  otherwise show a blank page. SvelteKit adds no hashes to a directive that has the keyword, so this has to
  come after the hashes. The script does nothing to a policy without a hash.
- **`style-src-attr 'unsafe-inline'`.** SvelteKit's route announcer, an accessibility live region, is made from
  a template with a `style` attribute, which a strict `style-src` blocks with a console error. Style attributes
  are the least risky thing to allow once scripts are locked down.
- **The headers.** `bun run serve:https` (and `bun run prd`) send the policy again as a header with
  `frame-ancestors 'none'`, taken from the page's own `<meta>`, and send `Cross-Origin-Opener-Policy`,
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS.
- **The check.** `bun run check:security` runs Google's CSP evaluator, the library Lighthouse uses, over every
  built page. CI and the deploy run it.

## Running Lighthouse

```bash
bun run lighthouse   # builds, serves over HTTPS, runs Lighthouse, fails on any Trust and Safety finding
```

It needs Chrome (set `CHROME_PATH` if Lighthouse does not find it) and fetches Lighthouse 13.6 with `bunx`.
CI runs it on every push.

It uses `https://127.0.0.1`, not `localhost`, because **the server leaves HSTS out for `localhost`**: a
browser would keep it for two years and then send every `http://localhost` address, on every port, to HTTPS,
which breaks the dev server on `http://localhost:5173` until the browser's HSTS cache is cleared. Browsers
ignore HSTS for IP addresses, so the header is sent to them. Lighthouse in DevTools on
`https://localhost:4173` therefore shows one finding, `has-hsts`; use `https://127.0.0.1:4173` for a clean
report.

## GitHub Pages cannot pass all of it

GitHub Pages does not let a site set response headers; the headers of the current site have none of the ones
above. On Pages:

| Audit | Result |
| --- | --- |
| `trusted-types-xss` | Clean, from the `<meta>` policy |
| `csp-xss` | Score 1, with the note to move the policy to a header |
| `clickjacking-mitigation` | Finding: `frame-ancestors` is ignored in a `<meta>` tag |
| `origin-isolation` | Finding: no header |
| `has-hsts` | Finding: no header |

A clean report on the deployed site needs a host that sets headers: Netlify or Cloudflare Pages (a `_headers`
file), or a CDN in front of Pages, such as Cloudflare with a transform rule. Send the headers of
`securityHeaders()` in `scripts/security-headers.ts`. The CSP header has to be the policy of the page's
`<meta>` tag, with `frame-ancestors 'none'` added, and its hashes change with the build, so the file has to
be generated by the build. That is not done yet.

## Changing the site

- A new origin (an analytics script, a font host) has to be added to the matching directive in
  `vite.config.ts`, or the browser blocks it.
- A new inline script or style needs nothing: SvelteKit hashes what it writes. An inline `style` attribute is
  allowed (see above), an inline event handler (`onclick="..."` in HTML) is not.
- Never set `'unsafe-inline'` for `script-src` in `vite.config.ts`: SvelteKit would add no hashes, and the
  policy would allow every inline script. `bun run check:security` catches it.
