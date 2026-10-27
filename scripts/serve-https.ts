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
 */
import { ensureCerts, lanAddresses, localNames, trustHelp } from "./certs.ts";

const ROOT = Bun.fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const port = Number(Bun.env.PORT ?? 4173);
const requestedDir = (Bun.env.SERVE_DIR ?? "dist").replace(/\/+$/, "");
/** `SERVE_DIR` is absolute, or relative to the repository root. */
const serveDir = requestedDir.startsWith("/") ? requestedDir : `${ROOT}/${requestedDir}`;
const serveRoot = Bun.pathToFileURL(`${serveDir}/`);

const cacheControl = (pathname: string): string =>
  pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache";

/** Serves `serveDir`, with `index.html` as the fallback for client routes. */
const serveFiles = async (request: Request): Promise<Response> => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let pathname = decodeURIComponent(new URL(request.url).pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  const candidate = new URL(`.${pathname}`, serveRoot);
  if (candidate.pathname.startsWith(serveRoot.pathname)) {
    const file = Bun.file(candidate);
    if (await file.exists()) {
      return new Response(file, { headers: { "cache-control": cacheControl(pathname) } });
    }
  }

  const fallback = Bun.file(`${serveDir}/index.html`);
  if (!/\.[^/]+$/.test(pathname) && (await fallback.exists())) {
    return new Response(fallback, { headers: { "cache-control": "no-cache" } });
  }
  return new Response("Not Found", { status: 404 });
};

const main = async (): Promise<void> => {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a number between 1 and 65535, got ${Bun.env.PORT ?? ""}`);
  }
  const served = await Array.fromAsync(new Bun.Glob("*").scan(serveDir)).catch(() => []);
  if (served.length === 0) {
    console.warn(`Nothing to serve in ${serveDir}; build first, or set SERVE_DIR.`);
  }

  const certificate = await ensureCerts();

  let server: ReturnType<typeof Bun.serve>;
  try {
    server = Bun.serve({
      port,
      hostname: "0.0.0.0",
      tls: { key: Bun.file(certificate.keyFile), cert: Bun.file(certificate.certFile) },
      fetch: serveFiles,
    });
  } catch (error) {
    if (error instanceof Error && /EADDRINUSE|in use/i.test(error.message)) {
      throw new Error(
        `Port ${port} is already in use. Choose another one, for example PORT=8443 bun run serve:https.`,
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
