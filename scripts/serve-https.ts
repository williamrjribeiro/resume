/**
 * `bun run serve:https`: serve a built directory over HTTPS on this machine and
 * the LAN, with a local certificate from `scripts/certs.ts`.
 *
 *   bun run serve:https                      serves dist/ on port 4173
 *   SERVE_DIR=apps/web/dist bun run serve:https
 *   PORT=8443 bun run serve:https
 *
 * This is for trying a production build, not a production server. Files come from
 * `SERVE_DIR` (default `dist`); a path without a file extension that matches no file
 * gets `index.html`, so client-side routes work.
 *
 * It speaks HTTP/3 (QUIC, on the same port number over UDP), HTTP/2 and HTTP/1.1, and compresses
 * text files with brotli, or gzip for clients without it. See `static-server.ts`.
 */
import { ensureCerts, lanAddresses, localNames, trustHelp } from "./certs.ts";
import { serveStatic } from "./static-server.ts";

const ROOT = Bun.fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const port = Number(Bun.env.PORT ?? 4173);
const requestedDir = (Bun.env.SERVE_DIR ?? "dist").replace(/\/+$/, "");
/** `SERVE_DIR` is absolute, or relative to the repository root. */
const serveDir = requestedDir.startsWith("/") ? requestedDir : `${ROOT}/${requestedDir}`;

const main = async (): Promise<void> => {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a number between 1 and 65535, got ${Bun.env.PORT ?? ""}`);
  }
  const served = await Array.fromAsync(new Bun.Glob("*").scan(serveDir)).catch(() => []);
  if (served.length === 0) {
    console.warn(`Nothing to serve in ${serveDir}; build first, or set SERVE_DIR.`);
  }

  const certificate = await ensureCerts();

  let server: ReturnType<typeof serveStatic>;
  try {
    server = serveStatic({ directory: serveDir, port, tls: certificate });
  } catch (error) {
    if (error instanceof Error && /EADDRINUSE|in use/i.test(error.message)) {
      throw new Error(
        `Port ${port} is already in use (HTTP/3 needs it free over UDP too). Choose another one, for example PORT=8443 bun run serve:https.`,
        { cause: error },
      );
    }
    throw error;
  }

  const [addresses, names] = await Promise.all([lanAddresses(), localNames()]);
  console.log("");
  console.log(`  ➜  Serving ${serveDir}`);
  console.log(`  ➜  Local:   https://localhost:${server.port}/`);
  for (const name of names.filter((value) => value.endsWith(".local"))) {
    console.log(`  ➜  Network: https://${name}:${server.port}/`);
  }
  for (const address of addresses) {
    console.log(`  ➜  Network: https://${address}:${server.port}/`);
  }
  console.log("");
  console.log(
    `  Protocols:   HTTP/3 (UDP ${server.port}), HTTP/2 and HTTP/1.1 (TCP ${server.port})`,
  );
  console.log("  Compression: brotli, gzip");
  console.log("");
  for (const line of trustHelp(certificate)) console.log(line);
  console.log("");
  console.log("Press Ctrl+C to stop.");

  const close = async (): Promise<void> => {
    await server.stop(true);
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
};

await main();
