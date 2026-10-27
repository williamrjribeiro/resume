import { describe, expect, it } from "bun:test";
import {
  certificateSans,
  isIP,
  opensslConfig,
  sameSans,
  trustHelp,
  type Certificate,
} from "./certs.ts";

describe("local HTTPS certificate", () => {
  describe("the names it covers", () => {
    it("always include localhost and the loopback addresses", () => {
      expect(certificateSans([], [])).toEqual(["127.0.0.1", "::1", "localhost"]);
    });

    it("add this host, its .local name and its LAN addresses once each, sorted", () => {
      expect(certificateSans(["192.168.1.5", "192.168.1.5"], ["box", "box.local", "box"])).toEqual([
        "127.0.0.1",
        "192.168.1.5",
        "::1",
        "box",
        "box.local",
        "localhost",
      ]);
    });

    it("are the same whatever the order", () => {
      expect(sameSans(["b", "a"], ["a", "b"])).toBe(true);
      expect(sameSans(["a"], ["a", "b"])).toBe(false);
    });

    it("tell addresses from names", () => {
      expect([isIP("10.0.0.2"), isIP("::1"), isIP("box.local")]).toEqual([true, true, false]);
    });
  });

  describe("the openssl fallback", () => {
    it("lists names as DNS entries and addresses as IP entries", () => {
      const config = opensslConfig(["127.0.0.1", "::1", "box.local", "localhost"]);
      expect(config).toContain("DNS.1 = box.local");
      expect(config).toContain("DNS.2 = localhost");
      expect(config).toContain("IP.1 = 127.0.0.1");
      expect(config).toContain("IP.2 = ::1");
    });
  });

  describe("the trust advice", () => {
    const base = { certFile: "c.pem", keyFile: "k.pem", sans: [] } satisfies Partial<Certificate>;

    it("points a phone at the mkcert root certificate", () => {
      const lines = trustHelp({ ...base, tool: "mkcert", caRoot: "/ca/rootCA.pem" });
      expect(lines.join("\n")).toContain("/ca/rootCA.pem");
    });

    it("warns about a self-signed certificate and says how to get a trusted one", () => {
      const text = trustHelp({ ...base, tool: "openssl" }).join("\n");
      expect(text).toContain("self-signed");
      expect(text).toContain("sudo pacman -S mkcert nss");
    });
  });
});
