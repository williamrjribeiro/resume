/** The small text helpers the résumé uses to show dates, phone numbers and addresses. */
import { describe, expect, it } from "bun:test";
import {
  formatBuildDate,
  formatMonthYear,
  obfuscate,
  stripProtocol,
  stripSpaces,
} from "./format.ts";

describe("format", () => {
  describe("formatMonthYear", () => {
    it("shows a date as month and year", () => {
      expect(formatMonthYear("2013-01-01")).toBe("01/2013");
      expect(formatMonthYear("2021-09-01")).toBe("09/2021");
    });
  });

  describe("formatBuildDate", () => {
    it("shows an ISO timestamp as day.month.year in UTC", () => {
      expect(formatBuildDate("2026-10-27T23:59:59.000Z")).toBe("27.10.2026");
    });
  });

  describe("stripSpaces", () => {
    it("makes a phone number dialable", () => {
      expect(stripSpaces("+351 912 856 244")).toBe("+351912856244");
    });
  });

  describe("stripProtocol", () => {
    it.each([
      ["https://williamrjribeiro.github.io/resume/", "williamrjribeiro.github.io/resume/"],
      ["http://example.com", "example.com"],
      ["example.com", "example.com"],
    ])("turns %s into %s", (url, expected) => {
      expect(stripProtocol(url)).toBe(expected);
    });
  });

  describe("obfuscate", () => {
    it("spells every character as an HTML entity", () => {
      expect(obfuscate("a@b")).toBe("&#97;&#64;&#98;");
    });

    it("keeps characters outside the BMP whole", () => {
      expect(obfuscate("😀")).toBe("&#128512;");
    });
  });
});
