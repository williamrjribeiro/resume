/** An inline icon, or the name of the network when there is none. */
import { describe, expect, it } from "bun:test";
import { renderComponent } from "../../../test/support/render.ts";
import Icon from "./Icon.svelte";

describe("Icon", () => {
  it("draws the icon and hides it from assistive technology", () => {
    const { body } = renderComponent(Icon, { name: "github" });
    expect(body).toStartWith("<svg");
    expect(body).toContain('aria-hidden="true"');
  });

  it("finds a network by its name as written", () => {
    expect(renderComponent(Icon, { name: "Github" }).body).toStartWith("<svg");
    expect(renderComponent(Icon, { name: "LinkedIn" }).body).toStartWith("<svg");
  });

  it("writes the name instead for a network without an icon", () => {
    expect(renderComponent(Icon, { name: "Mastodon" }).body).toBe(
      '<span aria-hidden="true">Mastodon:\u00a0</span>',
    );
  });
});
