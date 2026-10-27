/** A titled section of the page. */
import { describe, expect, it } from "bun:test";
import { createRawSnippet } from "svelte";
import { renderComponent } from "../../../test/support/render.ts";
import Section from "./Section.svelte";

describe("Section", () => {
  const children = createRawSnippet(() => ({ render: () => "<p>Inside</p>" }));

  it("has an id, a heading and its content", () => {
    const { body } = renderComponent(Section, { id: "section-skills", title: "Skills", children });
    expect(body).toContain('<section id="section-skills"');
    expect(body).toMatch(/<h2 [^>]*>\s*Skills\s*<\/h2>/);
    expect(body).toContain("<p>Inside</p>");
  });

  it("has no heading without a title", () => {
    const { body } = renderComponent(Section, { id: "x", children });
    expect(body).not.toContain("<h2");
  });

  it("adds the classes it is given to its own", () => {
    const { body } = renderComponent(Section, {
      id: "x",
      class: ["print:hidden", undefined],
      children,
    });
    expect(body).toMatch(/<section id="x" class="[^"]*break-inside-avoid[^"]*print:hidden"/);
  });
});
