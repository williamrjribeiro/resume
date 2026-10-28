/** The sidebar: email, telephone and print buttons. */
import { describe, expect, it } from "bun:test";
import { renderComponent } from "../../../test/support/render.ts";
import { author } from "#lib/data/author.ts";
import Sidebar from "./Sidebar.svelte";

describe("Sidebar", () => {
  const { body } = renderComponent(Sidebar, {});

  it("has an email link named Email, which does not show the address", () => {
    expect(body).toMatch(/<a [^>]*href="mailto:&#[^"]*"[^>]*aria-label="Email"/);
    expect(body).not.toContain(author.email);
  });

  it("has a telephone link named Telephone", () => {
    expect(body).toContain('aria-label="Telephone" href="tel:+351912856244"');
  });

  it("has a print button named Print Résumé", () => {
    expect(body).toMatch(/<button type="button"[^>]*aria-label="Print Résumé"/);
  });

  it("stays out of the printed résumé", () => {
    expect(body).toMatch(/^<aside [^>]*print:hidden/);
  });
});
