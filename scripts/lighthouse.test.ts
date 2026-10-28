/** Reading the Trust and Safety section of a Lighthouse report. */
import { describe, expect, it } from "bun:test";
import { trustAndSafetyProblems, type LighthouseReport } from "./lighthouse.ts";

describe("lighthouse", () => {
  describe("trustAndSafetyProblems", () => {
    const report = (
      audits: LighthouseReport["audits"],
      ids = Object.keys(audits),
    ): LighthouseReport => ({
      categories: {
        "best-practices": {
          score: 1,
          auditRefs: [
            ...ids.map((id) => ({ id, group: "best-practices-trust-safety" })),
            { id: "doctype", group: "best-practices-browser-compat" },
          ],
        },
      },
      audits: {
        ...audits,
        doctype: {
          score: 0,
          title: "Page has the HTML doctype",
          details: { items: [{ node: "x" }] },
        },
      },
    });

    it("finds nothing wrong with a section whose audits have no findings", () => {
      expect(
        trustAndSafetyProblems(
          report({
            "is-on-https": { score: 1, title: "Uses HTTPS", details: { items: [] } },
            "redirects-http": { score: null, title: "Redirects HTTP traffic to HTTPS" },
            "has-hsts": { score: null, title: "HSTS", details: { items: [] } },
          }),
        ),
      ).toEqual([]);
    });

    it("lists the findings of an informative audit, though its score is 1", () => {
      expect(
        trustAndSafetyProblems(
          report({
            "has-hsts": {
              score: 1,
              title: "HSTS",
              details: { items: [{ severity: "High", description: "No HSTS header found" }] },
            },
            "csp-xss": {
              score: 1,
              title: "CSP",
              details: { items: [{ directive: "script-src", description: "Add a fallback" }] },
            },
          }),
        ),
      ).toEqual(["has-hsts: No HSTS header found", "csp-xss: script-src: Add a fallback"]);
    });

    it("reports a failed audit", () => {
      expect(
        trustAndSafetyProblems(report({ "is-on-https": { score: 0, title: "Uses HTTPS" } })),
      ).toEqual(["is-on-https: failed"]);
    });

    it("ignores the audits of the other sections", () => {
      expect(
        trustAndSafetyProblems(report({ "is-on-https": { score: 1, title: "Uses HTTPS" } })),
      ).toEqual([]);
    });

    it("says so when the report has no such section, as with another category", () => {
      expect(
        trustAndSafetyProblems({
          categories: { performance: { score: 1, auditRefs: [] } },
          audits: {},
        }),
      ).toEqual(["the report has no Trust and Safety audits"]);
    });
  });
});
