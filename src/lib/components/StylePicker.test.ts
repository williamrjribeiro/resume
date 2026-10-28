/** The drop-down that picks a writing style. */
import { describe, expect, it } from "bun:test";
import { renderComponent } from "../../../test/support/render.ts";
import { strings } from "#lib/data/site.ts";
import StylePicker from "./StylePicker.svelte";

describe("StylePicker", () => {
  const styles = [
    { id: "original", label: "Original" },
    { id: "yoda", label: "Yoda" },
  ];
  const render = (props: Partial<Parameters<typeof StylePicker>[1]> = {}) =>
    renderComponent(StylePicker, { styles, value: "original", onchange: () => {}, ...props }).body;

  it("has a labelled drop-down", () => {
    const body = render();
    expect(body).toContain(`<label for="writing-style"`);
    expect(body).toContain(strings.labels.writingStyle);
    expect(body).toContain('<select id="writing-style"');
  });

  it("offers every style, the original first", () => {
    const options = [...render().matchAll(/<option value="([^"]+)"[^>]*>([^<]+)</g)];
    expect(options.map(([, id, label]) => [id, label])).toEqual([
      ["original", "Original"],
      ["yoda", "Yoda"],
    ]);
  });

  it("selects the style the page shows", () => {
    expect(render({ value: "yoda" })).toMatch(/<option value="yoda" selected/);
  });

  it("stays off until the page can answer a choice", () => {
    expect(render()).not.toMatch(/<select[^>]*\sdisabled[=\s>]/);
    expect(render({ disabled: true })).toMatch(/<select[^>]*\sdisabled[=\s>]/);
  });

  it("says when a style is loading and when it failed, to assistive technology too", () => {
    expect(render({ status: "loading" })).toContain(strings.labels.styleLoading);
    expect(render({ status: "failed" })).toContain(strings.labels.styleFailed);
    expect(render()).toContain('role="status"');
    expect(render()).not.toContain(strings.labels.styleLoading);
  });

  it("keeps the drop-down out of the printed résumé", () => {
    expect(render()).toMatch(/<div class="[^"]*print:hidden[^"]*">\s*<label for="writing-style"/);
  });

  it("prints the name of the style instead of the drop-down", () => {
    const printed = render({ value: "yoda" });
    expect(printed).toMatch(
      /<p class="hidden[^"]*print:block[^"]*">\s*In the style of\s+Yoda\s*<\/p>/,
    );
  });

  it("prints nothing about the style while the original is showing", () => {
    expect(render()).not.toContain(strings.labels.inStyleOf);
  });
});
