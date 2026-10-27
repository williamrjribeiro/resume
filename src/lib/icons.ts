const sources = import.meta.glob<string>("/src/assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ICON_CLASS =
  "pointer-events-none inline-block size-[1em] fill-current align-middle text-[1.5em]";

const icons = new Map<string, string>(
  Object.entries(sources).map(([path, svg]) => [
    (path.split("/").pop() ?? path).replace(/\.svg$/, ""),
    svg.replace("<svg ", `<svg class="${ICON_CLASS}" aria-hidden="true" focusable="false" `),
  ]),
);

/** The inline SVG of an icon in src/assets/icons, found by name ("GitHub" → github.svg). */
export function iconSvg(name: string): string | undefined {
  return icons.get(name.toLowerCase().replace(/\s/g, ""));
}
