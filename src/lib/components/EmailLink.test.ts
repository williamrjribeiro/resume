/** The email link, which hides the address from scrapers. */
import { describe, expect, it } from "bun:test";
import { parseMicroformats } from "../../../test/support/microformats.ts";
import { renderComponent } from "../../../test/support/render.ts";
import EmailLink from "./EmailLink.svelte";

describe("EmailLink", () => {
  const email = "jane@example.com";

  it("is an icon button named by its label", () => {
    const { body } = renderComponent(EmailLink, { email, label: "Email", class: "button" });
    expect(body).toContain('class="button"');
    expect(body).toContain('aria-label="Email"');
    expect(body).toContain("<svg");
    expect(body).not.toContain(email);
  });

  it("shows the address, as entities, when it shows text", () => {
    const { body } = renderComponent(EmailLink, {
      email,
      label: "Email",
      showText: true,
      class: "u-email",
    });
    expect(body).not.toContain("aria-label");
    expect(body).not.toContain(email);
    expect(
      parseMicroformats(`<div class="h-card">${body}</div>`).items[0]?.properties["email"],
    ).toEqual([`mailto:${email}`]);
  });
});
