/** A list of entries, newest first, marked up as the résumé's h-events. */
import { describe, expect, it } from "bun:test";
import { parseMicroformats } from "../../../test/support/microformats.ts";
import { renderComponent } from "../../../test/support/render.ts";
import type { Entry } from "#lib/content.ts";
import EntryList from "./EntryList.svelte";

describe("EntryList", () => {
  const entry = (id: string, title: string, overrides: Partial<Entry> = {}): Entry => ({
    id,
    kind: "work",
    title,
    start: "2020-01-01",
    printHidden: false,
    html: "",
    ...overrides,
  });
  const entries = [entry("new", "New job"), entry("old", "Old job", { printHidden: true })];
  const { body } = renderComponent(EntryList, { entries, property: "p-experience" });

  it("is a reversed list, because the entries run from newest to oldest", () => {
    expect(body).toMatch(/^<ol reversed/);
  });

  it("keeps the order it is given", () => {
    expect(body.indexOf("New job")).toBeLessThan(body.indexOf("Old job"));
  });

  it("marks every entry as an h-event of the given property of the résumé", () => {
    const { items } = parseMicroformats(`<main class="h-resume">${body}</main>`);
    const experience = items[0]?.properties["experience"] ?? [];
    expect(experience).toHaveLength(2);
    expect(experience).toMatchObject([{ type: ["h-event"] }, { type: ["h-event"] }]);
  });

  it("leaves out of the printed résumé the entries that ask for it", () => {
    const items = body.split("<li ").slice(1);
    expect(items[0]).not.toContain("print:hidden");
    expect(items[1]).toMatch(/^class="[^"]*print:hidden/);
  });

  it("renders nothing for no entries", () => {
    const empty = renderComponent(EntryList, { entries: [], property: "p-apps" }).body;
    expect(empty).not.toContain("<li");
  });
});
