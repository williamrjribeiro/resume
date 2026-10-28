/**
 * The file server behind `bun run serve:https`: HTTP/3, HTTP/2 and HTTP/1.1 on one port, and
 * brotli (or gzip) compression for the files that compress, and the security headers that a static host
 * such as GitHub Pages cannot set (`security-headers.ts`).
 *
 * `Bun.serve` speaks the three protocols but does not compress responses, so compression is done
 * here. Static files do not change between requests, so each compressed file is made once and kept
 * until the file changes.
 */

import { promisify } from "node:util";
import { brotliCompress, constants } from "node:zlib";
import { securityHeaders } from "./security-headers.ts";

/** The `Content-Encoding` values this server can produce, from the most to the least preferred. */
export type Encoding = "br" | "gzip";

const PREFERRED_ENCODINGS: ReadonlyArray<Encoding> = ["br", "gzip"];

/** Below this, the headers weigh more than what compression saves. */
const MIN_COMPRESSIBLE_BYTES = 256;

const brotli = promisify(brotliCompress);

/**
 * The best encoding a request accepts, or `undefined` to send the file as it is. Follows the
 * `Accept-Encoding` rules: `q=0` forbids an encoding, `*` stands for the ones not named, and
 * brotli wins a tie.
 */
export const negotiateEncoding = (acceptEncoding: string | null): Encoding | undefined => {
  if (acceptEncoding === null) return undefined;
  const weights = new Map<string, number>();
  for (const entry of acceptEncoding.toLowerCase().split(",")) {
    const [name = "", ...parameters] = entry.split(";").map((part) => part.trim());
    const quality = parameters.find((parameter) => parameter.startsWith("q="));
    const weight = quality === undefined ? 1 : Number(quality.slice(2));
    weights.set(name, Number.isNaN(weight) ? 0 : weight);
  }
  const weightOf = (encoding: Encoding): number => weights.get(encoding) ?? weights.get("*") ?? 0;

  let best: Encoding | undefined;
  for (const encoding of PREFERRED_ENCODINGS) {
    if (weightOf(encoding) > (best === undefined ? 0 : weightOf(best))) best = encoding;
  }
  return best;
};

/** Whether a `Content-Type` is text-like. Images, fonts such as woff2, and video already are compressed. */
export const isCompressible = (contentType: string): boolean => {
  const type = (contentType.split(";")[0] ?? "").trim().toLowerCase();
  return (
    type.startsWith("text/") ||
    /^application\/(?:json|javascript|xml|.+\+(?:json|xml))$/.test(type) ||
    type === "image/svg+xml" ||
    type === "image/x-icon" ||
    type === "image/vnd.microsoft.icon" ||
    type === "font/ttf" ||
    type === "font/otf" ||
    type === "application/vnd.ms-fontobject"
  );
};

/**
 * Compresses at the best quality, which is paid once per file, not once per request.
 *
 * Brotli (quality 11) has no `Bun` function, so it comes from `node:zlib`, whose async version runs
 * off the main thread: at this quality a big file takes seconds. Gzip is `Bun.gzipSync` with
 * libdeflate at its best level (12), which makes smaller files than zlib's best and is fast enough
 * to run on the main thread: a few milliseconds for the files of a site.
 */
const compress = async (
  bytes: Uint8Array<ArrayBuffer>,
  encoding: Encoding,
): Promise<Uint8Array<ArrayBuffer>> =>
  encoding === "gzip"
    ? Bun.gzipSync(bytes, { library: "libdeflate", level: 12 })
    : new Uint8Array(await brotli(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));

const cacheControl = (pathname: string): string =>
  pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache";

export type StaticHandlerOptions = {
  /** The absolute path of the directory to serve. */
  readonly directory: string;
};

/**
 * A `fetch` handler that serves `directory`, with `index.html` as the fallback for client routes
 * and the best compression the request accepts for the files that compress.
 */
export const createStaticHandler = ({ directory }: StaticHandlerOptions) => {
  const root = Bun.pathToFileURL(`${directory}/`);
  /** One compressed copy per file and encoding, replaced when the file changes. */
  const compressed = new Map<
    string,
    { readonly stamp: string; readonly bytes: Uint8Array<ArrayBuffer> }
  >();

  const compressedCopy = async (
    file: ReturnType<typeof Bun.file>,
    pathname: string,
    encoding: Encoding,
  ): Promise<Uint8Array<ArrayBuffer>> => {
    const key = `${encoding}:${pathname}`;
    const stamp = `${file.lastModified}:${file.size}`;
    const cached = compressed.get(key);
    if (cached?.stamp === stamp) return cached.bytes;
    const bytes = await compress(new Uint8Array(await file.arrayBuffer()), encoding);
    compressed.set(key, { stamp, bytes });
    return bytes;
  };

  const respond = async (
    request: Request,
    file: ReturnType<typeof Bun.file>,
    pathname: string,
    cacheControlValue: string,
  ): Promise<Response> => {
    const html = file.type.startsWith("text/html") ? await file.text() : undefined;
    const headers: Record<string, string> = {
      "cache-control": cacheControlValue,
      ...securityHeaders({
        hostname: new URL(request.url).hostname,
        ...(html === undefined ? {} : { html }),
      }),
    };
    if (isCompressible(file.type) && file.size >= MIN_COMPRESSIBLE_BYTES) {
      // The same address answers differently depending on what the client accepts.
      headers["vary"] = "Accept-Encoding";
      const encoding = negotiateEncoding(request.headers.get("accept-encoding"));
      if (encoding !== undefined) {
        headers["content-encoding"] = encoding;
        headers["content-type"] = file.type;
        return new Response(await compressedCopy(file, pathname, encoding), { headers });
      }
    }
    return new Response(file, { headers });
  };

  return async (request: Request): Promise<Response> => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
    if (pathname.endsWith("/")) pathname += "index.html";

    const candidate = new URL(`.${pathname}`, root);
    if (candidate.pathname.startsWith(root.pathname)) {
      const file = Bun.file(candidate);
      if (await file.exists()) return respond(request, file, pathname, cacheControl(pathname));
    }

    const fallback = Bun.file(`${directory}/index.html`);
    if (!/\.[^/]+$/.test(pathname) && (await fallback.exists())) {
      return respond(request, fallback, "/index.html", "no-cache");
    }
    return new Response("Not Found", { status: 404 });
  };
};

export type ServeStaticOptions = StaticHandlerOptions & {
  /** `0` picks a free port. The same number is used for TCP (HTTP/2, HTTP/1.1) and UDP (HTTP/3). */
  readonly port: number;
  readonly hostname?: string;
  /** HTTP/3 and the browsers' HTTP/2 need TLS. */
  readonly tls: { readonly keyFile: string; readonly certFile: string };
};

/**
 * Serves `directory` over HTTPS with HTTP/3, HTTP/2 and HTTP/1.1. Each connection gets the best
 * protocol the client offers (HTTP/2 through ALPN, HTTP/3 through the `Alt-Svc` header Bun adds),
 * and clients that offer neither get HTTP/1.1.
 */
export const serveStatic = ({ directory, port, hostname = "0.0.0.0", tls }: ServeStaticOptions) =>
  Bun.serve({
    port,
    hostname,
    tls: { key: Bun.file(tls.keyFile), cert: Bun.file(tls.certFile) },
    http3: true,
    http2: true,
    http1: true,
    fetch: createStaticHandler({ directory }),
  });
