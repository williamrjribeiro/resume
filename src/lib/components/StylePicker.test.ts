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

  it("stays out of the printed résumé", () => {
    expect(render()).toContain("print:hidden");
  });
});
