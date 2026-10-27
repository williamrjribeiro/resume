/** Chrome for Testing: skip when present; Linux uses --with-deps. */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  chromeForTestingPath,
  installAgentBrowserChrome,
  type SpawnResult,
} from "./install-agent-browser-chrome.ts";

describe("install-agent-browser-chrome", () => {
  const tmpRoot = Bun.env.TMPDIR ?? "/tmp";
  const failedInstall = (): SpawnResult => ({
    exitCode: 1,
    stdout: "",
    stderr: "download exploded",
  });

  describe("when Chrome for Testing is already present", () => {
    let home = "";
    let chrome = "";

    beforeAll(async () => {
      home = `${tmpRoot}/agent-browser-chrome-present-${crypto.randomUUID()}`;
      chrome = `${home}/.agent-browser/browsers/chrome-155.0.8059.39/chrome`;
      await Bun.write(chrome, "");
    });

    afterAll(async () => {
      await Bun.$`rm -rf ${home}`;
    });

    it("finds the Chrome binary", () => {
      expect(chromeForTestingPath(home)).toBe(chrome);
    });

    it("skips the download and still succeeds", () => {
      const installCalls: Array<ReadonlyArray<string>> = [];
      const logs: Array<string> = [];
      const code = installAgentBrowserChrome({
        home,
        install: (args) => {
          installCalls.push(args);
          return failedInstall();
        },
        log: (message) => logs.push(message),
      });
      expect(code).toBe(0);
      expect(installCalls).toEqual([]);
      expect(logs.join("\n")).toContain(chrome);
    });
  });

  describe("when Chrome for Testing is missing", () => {
    let home = "";

    beforeAll(async () => {
      home = `${tmpRoot}/agent-browser-chrome-missing-${crypto.randomUUID()}`;
      await Bun.write(`${home}/.keep`, "");
    });

    afterAll(async () => {
      await Bun.$`rm -rf ${home}`;
    });

    it("finds no Chrome binary", () => {
      expect(chromeForTestingPath(home)).toBeUndefined();
    });

    it("installs with --with-deps on Linux", () => {
      const installCalls: Array<ReadonlyArray<string>> = [];
      const code = installAgentBrowserChrome({
        home,
        platform: "linux",
        install: (args) => {
          installCalls.push(args);
          return { exitCode: 0, stdout: "installed", stderr: "" };
        },
      });
      expect(code).toBe(0);
      expect(installCalls).toEqual([["install", "--with-deps"]]);
    });

    it("installs without --with-deps on macOS", () => {
      const installCalls: Array<ReadonlyArray<string>> = [];
      const code = installAgentBrowserChrome({
        home,
        platform: "darwin",
        install: (args) => {
          installCalls.push(args);
          return { exitCode: 0, stdout: "installed", stderr: "" };
        },
      });
      expect(code).toBe(0);
      expect(installCalls).toEqual([["install"]]);
    });

    it("returns the installer exit code when the download fails", () => {
      const code = installAgentBrowserChrome({
        home,
        platform: "linux",
        install: failedInstall,
        log: () => undefined,
      });
      expect(code).toBe(1);
    });
  });
});
