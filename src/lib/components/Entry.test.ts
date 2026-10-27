/** One job, degree, app or volunteering stint. */
import { describe, expect, it } from "bun:test";
import { parseMicroformats } from "../../../test/support/microformats.ts";
import { renderComponent } from "../../../test/support/render.ts";
import type { Entry } from "#lib/content.ts";
import EntryComponent from "./Entry.svelte";

describe("Entry", () => {
  const job: Entry = {
    id: "2009-tricode",
    kind: "work",
    title: "Software Engineer",
    start: "2009-08-01",
    end: "2010-11-01",
    organization: "Tricode",
    organizationUrl: "https://www.tricode.nl/",
    location: "Veenendaal, NL",
    printHidden: false,
    html: "<p>Part of an <strong>Agile</strong> team.</p>",
  };
  const app: Entry = {
    id: "2013-wappy",
    kind: "apps",
    title: "Wappy",
    start: "2013-01-01",
    end: "2014-01-01",
    sourceCodeUrl: "https://github.com/x/wappy",
    storeUrl: "https://store.example/wappy",
    printHidden: false,
    html: "",
  };
  const render = (entry: Entry) => renderComponent(EntryComponent, { entry }).body;
  /** What a microformats2 parser makes of the entry, which the list marks as an h-event. */
  const event = (entry: Entry) =>
    parseMicroformats(`<div class="h-event">${render(entry)}</div>`).items[0];

  it("names the entry", () => {
    expect(event(job)?.properties["name"]).toEqual(["Software Engineer"]);
  });

  it("gives the start and the end as machine-readable dates", () => {
    expect(event(job)?.properties["start"]).toEqual(["2009-08-01"]);
    expect(event(job)?.properties["end"]).toEqual(["2010-11-01"]);
    expect(render(job)).toContain(">08/2009</time>");
    expect(render(job)).toContain(">11/2010</time>");
  });

  it("says Present for an entry that has not ended", () => {
    const { end: _end, ...ongoing } = job;
    expect(render(ongoing)).toContain("<span>Present</span>");
    expect(event(ongoing)?.properties["end"]).toBeUndefined();
  });

  it("links the organization as a nested h-card that opens in a new tab", () => {
    const [org] = event(job)?.properties["org"] ?? [];
    expect(org).toMatchObject({
      type: ["h-card"],
      properties: { name: ["Tricode"], url: ["https://www.tricode.nl/"] },
    });
    expect(render(job)).toContain('target="_blank" rel="noopener noreferrer"');
  });

  it("names an organization that has no link", () => {
    const { organizationUrl: _url, ...unlinked } = job;
    const [org] = event(unlinked)?.properties["org"] ?? [];
    expect(org).toMatchObject({ properties: { name: ["Tricode"] } });
    expect(render(unlinked)).not.toContain("<a ");
  });

  it("gives the location to the event, not to the organization's h-card", () => {
    expect(event(job)?.properties["location"]).toEqual(["Veenendaal, NL"]);
    const [org] = event(job)?.properties["org"] ?? [];
    expect(org).not.toHaveProperty("properties.location");
  });

  it("renders the Markdown body as the summary", () => {
    expect(event(job)?.properties["summary"]).toEqual(["Part of an Agile team."]);
    expect(render(job)).toContain("<strong>Agile</strong>");
  });

  it("has no body when the entry has no text", () => {
    expect(render(app)).not.toContain("p-summary");
  });

  it("links an app's source and store, separated by a dot, without an organization", () => {
    const html = render(app);
    expect(html).not.toContain("p-org");
    expect(html).toMatch(/>Source<\/a>\s*<span aria-hidden="true">·<\/span>\s*<a [^>]*>Store<\/a>/);
    expect(html).toContain('href="https://github.com/x/wappy"');
    expect(html).toContain('href="https://store.example/wappy"');
  });
});
