# Local HTTPS

`bun run prd` builds the site and serves `build/` over HTTPS on port 4173, so you can try a production build in a browser or install a PWA from a phone on the LAN (service workers and "Add to Home Screen" need HTTPS). It is not a production server.

```bash
bun run prd                          # https://localhost:4173, plus the LAN addresses it prints
PORT=8443 bun run prd                # another port
SERVE_DIR=build bun run serve:https   # serve a build directory without building
bun run certs                        # only create the certificate
bun run certs:clean                  # delete it
```

`SERVE_DIR` is absolute or relative to the repo root; a path with no file extension that matches no file gets `index.html`, so client-side routes work.

## Protocols and compression

The server speaks HTTP/3, HTTP/2 and HTTP/1.1 on the same port number (`scripts/static-server.ts`):

- **HTTP/2 and HTTP/1.1** run over TCP. The client picks one during the TLS handshake (ALPN): browsers and `curl` get HTTP/2, anything else gets HTTP/1.1.
- **HTTP/3** runs over QUIC, which uses **UDP** on that port. A browser learns about it from the `Alt-Svc` header of its first response, so the first load is HTTP/2 and later loads use HTTP/3. **Let UDP through the firewall** as well as TCP if you open the site from another device.
- **Chromium only uses HTTP/3 with a trusted certificate**, so use the mkcert setup below. With the self-signed fallback the browser stays on HTTP/2.
- Bun marks its HTTP/3 and HTTP/2 support as experimental. When a client insists on HTTP/3, the server occasionally closes the connection while it is being set up (seen with Chromium; Bun's own client never hit it). Browsers fall back to HTTP/2 by themselves.

Text-like files (HTML, CSS, JavaScript, JSON, SVG, the manifest) of 256 bytes or more are compressed with **brotli**, or with gzip for a client that does not accept brotli. Images and woff2 fonts are left alone, and the response says `Vary: Accept-Encoding`. Each file is compressed once, at the best quality, and the copy is kept until the file changes.

```bash
curl -sk --http2 -H 'accept-encoding: br' -o /dev/null -D - https://localhost:4173/   # HTTP/2, content-encoding: br
curl -sk --http1.1 -H 'accept-encoding: gzip' -o /dev/null -D - https://localhost:4173/
curl -sk --http3 -I https://localhost:4173/   # needs a curl built with HTTP/3 support
```

In a browser, open the network panel and add the **Protocol** column (`h3`, `h2`) and look at **Content-Encoding** (`br`). Bun's own `fetch` can test one protocol at a time: `fetch(url, { protocol: "http3" })` fails instead of falling back.

The certificate lives in `.certs/` (git-ignored; the private key is a secret, so never commit it). It names `localhost`, `127.0.0.1`, `::1`, this host (`host` and `host.local`) and the machine's current LAN IPv4 addresses, and is made again when those change. **Arch Linux only for now:** it reads addresses with `ip` (`iproute2`) and the trust steps below use `pacman`.

- **Trusted (recommended):** install [mkcert](https://github.com/FiloSottile/mkcert) and trust its local CA once, then delete any old certificate.

  ```bash
  sudo pacman -S mkcert nss   # nss provides certutil for Chromium and Firefox
  mkcert -install             # asks for sudo to update the system trust store
  bun run certs:clean && bun run certs
  ```

  On an iPhone or iPad, install the root CA once (`mkcert -CAROOT` prints its directory; the file is `rootCA.pem`), then enable full trust under **Settings → General → About → Certificate Trust Settings**.

- **Self-signed fallback:** without mkcert the scripts use `openssl` (`sudo pacman -S openssl`). The server works, but browsers and phones warn, and a service worker may not register until the certificate is trusted.
