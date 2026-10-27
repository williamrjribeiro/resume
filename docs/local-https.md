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

The certificate lives in `.certs/` (git-ignored; the private key is a secret, so never commit it). It names `localhost`, `127.0.0.1`, `::1`, this host (`host` and `host.local`) and the machine's current LAN IPv4 addresses, and is made again when those change. **Arch Linux only for now:** it reads addresses with `ip` (`iproute2`) and the trust steps below use `pacman`.

- **Trusted (recommended):** install [mkcert](https://github.com/FiloSottile/mkcert) and trust its local CA once, then delete any old certificate.

  ```bash
  sudo pacman -S mkcert nss   # nss provides certutil for Chromium and Firefox
  mkcert -install             # asks for sudo to update the system trust store
  bun run certs:clean && bun run certs
  ```

  On an iPhone or iPad, install the root CA once (`mkcert -CAROOT` prints its directory; the file is `rootCA.pem`), then enable full trust under **Settings → General → About → Certificate Trust Settings**.

- **Self-signed fallback:** without mkcert the scripts use `openssl` (`sudo pacman -S openssl`). The server works, but browsers and phones warn, and a service worker may not register until the certificate is trusted.
