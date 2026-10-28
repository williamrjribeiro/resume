/** The file server behind `bun run serve:https`: protocols, brotli and gzip, and what it serves. */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brotliDecompressSync, gunzipSync, gzipSync } from "node:zlib";
import { ensureCerts } from "./certs.ts";
import {
  createStaticHandler,
  isCompressible,
  negotiateEncoding,
  serveStatic,
} from "./static-server.ts";

const decompress = (bytes: ArrayBuffer, format: "brotli" | "gzip"): string =>
  (format === "brotli" ? brotliDecompressSync(bytes) : gunzipSync(bytes)).toString();

describe("static-server", () => {
  describe("negotiateEncoding", () => {
    it.each([
      ["br", "br"],
      ["gzip", "gzip"],
      ["gzip, deflate, br", "br"],
      ["br, gzip", "br"],
      ["gzip;q=1.0, br;q=0.5", "gzip"],
      ["br;q=0, gzip", "gzip"],
      ["*", "br"],
      ["gzip, *;q=0", "gzip"],
      ["identity, br;q=0.8, gzip;q=0.8", "br"],
      ["BR", "br"],
    ])("chooses %j → %s", (header, expected) => {
      expect(negotiateEncoding(header)).toBe(expected as "br" | "gzip");
    });

    it.each([null, "", "identity", "deflate", "zstd", "br;q=0, gzip;q=0", "*;q=0", "br;q=oops"])(
      "sends the file as it is for %j",
      (header) => {
        expect(negotiateEncoding(header)).toBeUndefined();
      },
    );
  });

  describe("isCompressible", () => {
    it.each([
      "text/html;charset=utf-8",
      "text/css;charset=utf-8",
      "text/javascript;charset=utf-8",
      "application/json;charset=utf-8",
      "application/manifest+json",
      "application/xml",
      "image/svg+xml",
      "image/x-icon",
      "font/ttf",
    ])("compresses %s", (type) => {
      expect(isCompressible(type)).toBe(true);
    });

    it.each([
      "image/png",
      "image/jpeg",
      "image/webp",
      "font/woff2",
      "font/woff",
      "video/mp4",
      "application/octet-stream",
    ])("leaves %s as it is, because it is compressed already", (type) => {
      expect(isCompressible(type)).toBe(false);
    });
  });

  describe("the handler", () => {
    let directory = "";
    let handle: (request: Request) => Promise<Response> = () => Promise.resolve(new Response());
    const page = `<!doctype html><title>Résumé</title>${"<p>A paragraph of text that repeats.</p>".repeat(100)}`;
    const get = (path: string, acceptEncoding?: string, init: RequestInit = {}) =>
      handle(
        new Request(`https://localhost${path}`, {
          ...init,
          headers: acceptEncoding === undefined ? {} : { "accept-encoding": acceptEncoding },
        }),
      );

    const secure = `<!doctype html><meta http-equiv="content-security-policy" content="default-src 'none'; script-src 'self' 'sha256-abc='"><title>x</title>${"<p>text</p>".repeat(50)}`;
    const getFrom = (origin: string, path: string) => handle(new Request(`${origin}${path}`));

    beforeAll(() => {
      directory = mkdtempSync(join(tmpdir(), "static-server-"));
      writeFileSync(join(directory, "secure.html"), secure);
      mkdirSync(join(directory, "assets"));
      writeFileSync(join(directory, "index.html"), page);
      writeFileSync(join(directory, "tiny.txt"), "tiny");
      writeFileSync(join(directory, "photo.png"), Buffer.alloc(4096, 7));
      writeFileSync(join(directory, "assets", "app.js"), "console.log(1);\n".repeat(200));
      handle = createStaticHandler({ directory });
    });

    afterAll(() => {
      rmSync(directory, { recursive: true, force: true });
    });

    it("compresses with brotli for a client that accepts it", async () => {
      const response = await get("/", "gzip, deflate, br");
      expect(response.status).toBe(200);
      expect(response.headers.get("content-encoding")).toBe("br");
      expect(response.headers.get("content-type")).toBe("text/html;charset=utf-8");
      expect(response.headers.get("vary")).toBe("Accept-Encoding");
      const body = await response.arrayBuffer();
      expect(body.byteLength).toBeLessThan(page.length / 5);
      expect(decompress(body, "brotli")).toBe(page);
    });

    it("falls back to gzip for a client without brotli", async () => {
      const response = await get("/index.html", "gzip");
      expect(response.headers.get("content-encoding")).toBe("gzip");
      expect(decompress(await response.arrayBuffer(), "gzip")).toBe(page);
    });

    it("makes gzip files no bigger than zlib's best", async () => {
      const response = await get("/index.html", "gzip");
      const bytes = (await response.arrayBuffer()).byteLength;
      expect(bytes).toBeLessThanOrEqual(gzipSync(page, { level: 9 }).byteLength);
    });

    it("sends the file as it is to a client that accepts no encoding, but still varies", async () => {
      const response = await get("/");
      expect(response.headers.get("content-encoding")).toBeNull();
      expect(response.headers.get("vary")).toBe("Accept-Encoding");
      expect(await response.text()).toBe(page);
    });

    it("gives the same bytes every time, from the copy it made the first time", async () => {
      const first = new Uint8Array(await (await get("/", "br")).arrayBuffer());
      const second = new Uint8Array(await (await get("/", "br")).arrayBuffer());
      expect(second).toEqual(first);
    });

    it("compresses the file again when it changes", async () => {
      const path = join(directory, "changing.txt");
      writeFileSync(path, "first ".repeat(100));
      const before = decompress(await (await get("/changing.txt", "br")).arrayBuffer(), "brotli");
      writeFileSync(path, "second ".repeat(120));
      const after = decompress(await (await get("/changing.txt", "br")).arrayBuffer(), "brotli");
      expect(before).toBe("first ".repeat(100));
      expect(after).toBe("second ".repeat(120));
    });

    it("sends a page's own CSP as a header too, with frame-ancestors, which a meta tag cannot carry", async () => {
      const response = await getFrom("https://127.0.0.1", "/secure.html");
      expect(response.headers.get("content-security-policy")).toBe(
        "default-src 'none'; script-src 'self' 'sha256-abc='; frame-ancestors 'none'",
      );
    });

    it("sends the headers that isolate and protect the page", async () => {
      const response = await getFrom("https://127.0.0.1", "/secure.html");
      expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("strict-transport-security")).toContain("max-age=63072000");
    });

    it("sends them with the compressed copy as well", async () => {
      const response = await handle(
        new Request("https://127.0.0.1/secure.html", { headers: { "accept-encoding": "br" } }),
      );
      expect(response.headers.get("content-encoding")).toBe("br");
      expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
      expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    });

    it("keeps HSTS off localhost, where it would break every http:// address", async () => {
      const response = await getFrom("https://localhost", "/secure.html");
      expect(response.headers.get("strict-transport-security")).toBeNull();
      expect(response.headers.get("x-frame-options")).toBe("DENY");
    });

    it("sends no CSP with a file that is not a page, but the other headers", async () => {
      const response = await getFrom("https://127.0.0.1", "/assets/app.js");
      expect(response.headers.get("content-security-policy")).toBeNull();
      expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
    });

    it("leaves images alone", async () => {
      const response = await get("/photo.png", "br, gzip");
      expect(response.headers.get("content-encoding")).toBeNull();
      expect(response.headers.get("vary")).toBeNull();
      expect((await response.arrayBuffer()).byteLength).toBe(4096);
    });

    it("leaves tiny files alone", async () => {
      const response = await get("/tiny.txt", "br");
      expect(response.headers.get("content-encoding")).toBeNull();
      expect(await response.text()).toBe("tiny");
    });

    it("caches what is under /assets/ for good and nothing else", async () => {
      expect((await get("/assets/app.js")).headers.get("cache-control")).toBe(
        "public, max-age=31536000, immutable",
      );
      expect((await get("/")).headers.get("cache-control")).toBe("no-cache");
    });

    it("gives a path without an extension the index page, for client-side routes", async () => {
      const response = await get("/some/route", "br");
      expect(response.status).toBe(200);
      expect(decompress(await response.arrayBuffer(), "brotli")).toBe(page);
    });

    it("does not find a missing file", async () => {
      expect((await get("/missing.css")).status).toBe(404);
    });

    it.each(["/../secret", "/%2e%2e/secret", "/assets/../../secret.txt"])(
      "does not leave the directory for %s",
      async (path) => {
        const response = await get(path);
        expect(response.status === 404 || (await response.text()) === page).toBe(true);
      },
    );

    it("refuses anything but GET and HEAD", async () => {
      expect((await get("/", undefined, { method: "POST" })).status).toBe(405);
    });

    it("refuses an address that is not valid", async () => {
      expect((await get("/%E0%A4%A")).status).toBe(400);
    });
  });

  describe("the server", () => {
    let directory = "";
    let certDirectory = "";
    let server: ReturnType<typeof serveStatic> | undefined;
    const page = `<!doctype html><title>Hello</title>${"<p>Served over every protocol.</p>".repeat(100)}`;
    const request = (protocol: "http1.1" | "http2" | "http3") =>
      fetch(`https://127.0.0.1:${server?.port}/`, {
        protocol,
        headers: { "accept-encoding": "br, gzip" },
        tls: { rejectUnauthorized: false },
      });

    beforeAll(async () => {
      directory = mkdtempSync(join(tmpdir(), "static-server-"));
      certDirectory = mkdtempSync(join(tmpdir(), "static-server-certs-"));
      writeFileSync(join(directory, "index.html"), page);
      const certificate = await ensureCerts({ certDir: certDirectory });
      server = serveStatic({ directory, port: 0, hostname: "127.0.0.1", tls: certificate });
    });

    afterAll(async () => {
      await server?.stop(true);
      rmSync(directory, { recursive: true, force: true });
      rmSync(certDirectory, { recursive: true, force: true });
    });

    // `fetch` is told which protocol to use and does not fall back, so a 200 means the server
    // spoke that protocol.
    it.each(["http3", "http2", "http1.1"] as const)("answers over %s", async (protocol) => {
      const response = await request(protocol);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(page);
    });

    it.each(["http3", "http2", "http1.1"] as const)(
      "compresses with brotli over %s",
      async (protocol) => {
        const response = await request(protocol);
        expect(response.headers.get("content-encoding")).toBe("br");
      },
    );

    it.each(["http3", "http2", "http1.1"] as const)(
      "sends the security headers over %s",
      async (protocol) => {
        const response = await request(protocol);
        expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
        expect(response.headers.get("x-frame-options")).toBe("DENY");
        expect(response.headers.get("strict-transport-security")).toContain("includeSubDomains");
      },
    );

    it.each(["http2", "http1.1"] as const)(
      "tells a client on %s that HTTP/3 is on the same port",
      async (protocol) => {
        const response = await request(protocol);
        expect(response.headers.get("alt-svc")).toContain(`h3=":${server?.port}"`);
      },
    );
  });
});
