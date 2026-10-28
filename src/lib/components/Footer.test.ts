/** The footer. */
import { describe, expect, it } from "bun:test";
import { renderComponent } from "../../../test/support/render.ts";
import { author } from "#lib/data/author.ts";
import Footer from "./Footer.svelte";

describe("Footer", () => {
  const { body } = renderComponent(Footer, { builtAt: "2026-10-27T23:15:00.000Z" });

  it("names the author", () => {
    expect(body).toContain(`© ${author.name}`);
  });

  it("says when the site was built", () => {
    expect(body).toContain("Last updated: 27.10.2026");
  });

  it("stays out of the printed résumé", () => {
    expect(body).toContain("print:hidden");
  });
});
