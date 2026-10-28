/** Only the Bun in .bun-version is used. */
import { describe, expect, it } from "bun:test";
import { bunVersionProblems, readBunVersionSources } from "./check-bun-version.ts";

describe("check-bun-version", () => {
  describe("bunVersionProblems", () => {
    const agreeing = {
      pinned: "1.4.4",
      running: "1.4.4",
      packageManager: "bun@1.4.4",
      engine: "1.4.4",
      types: "1.4.4",
    };

    it("finds nothing wrong when every place says the pinned version", () => {
      expect(bunVersionProblems(agreeing)).toEqual([]);
    });

    it("refuses another Bun, and says how to install the right one", () => {
      const [problem, ...rest] = bunVersionProblems({ ...agreeing, running: "1.4.3" });
      expect(rest).toEqual([]);
      expect(problem).toContain("Bun 1.4.4 is required (.bun-version), but this is Bun 1.4.3");
      expect(problem).toContain('curl -fsSL https://bun.com/install | bash -s "bun-v1.4.4"');
    });

    it.each([
      [
        "packageManager",
        { packageManager: "bun@1.4.3" },
        'packageManager in package.json is "bun@1.4.3"',
      ],
      [
        "packageManager",
        { packageManager: undefined },
        'packageManager in package.json is "missing"',
      ],
      ["engines.bun", { engine: "^1.4.0" }, 'engines.bun in package.json is "^1.4.0"'],
      ["@types/bun", { types: "latest" }, '@types/bun in package.json is "latest"'],
      ["@types/bun", { types: "^1.4.4" }, '@types/bun in package.json is "^1.4.4"'],
    ] as const)("refuses a package.json whose %s differs", (_name, change, message) => {
      expect(bunVersionProblems({ ...agreeing, ...change }).join("\n")).toContain(message);
    });

    it.each(["1.4", "^1.4.4", "latest", "", "v1.4.4"])(
      "refuses a .bun-version that is not one exact version: %j",
      (pinned) => {
        expect(bunVersionProblems({ ...agreeing, pinned })).toEqual([
          `.bun-version must hold one exact version such as 1.4.4, not "${pinned}"`,
        ]);
      },
    );
  });

  describe("this repository", () => {
    // Enforced wherever the tests run: on a machine, in the git hooks, in CI.
    it("uses the pinned Bun, and package.json says the same version everywhere", async () => {
      const sources = await readBunVersionSources(`${import.meta.dir}/..`);
      expect(bunVersionProblems(sources)).toEqual([]);
    });
  });
});
