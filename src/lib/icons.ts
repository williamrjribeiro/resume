const ICON_CLASS =
  "pointer-events-none inline-block size-[1em] fill-current align-middle text-[1.5em]";

/**
 * Looks icons up by name in SVG sources keyed by path (`/src/assets/icons/github.svg`), as
 * `import.meta.glob` returns them. The lookup is case- and space-insensitive: "GitHub" finds github.svg.
 */
export function createIconLookup(
  sources: Readonly<Record<string, string>>,
): (name: string) => string | undefined {
  const icons = new Map<string, string>(
    Object.entries(sources).map(([path, svg]) => [
      (path.split("/").pop() ?? path).replace(/\.svg$/, ""),
      svg.replace("<svg ", `<svg class="${ICON_CLASS}" aria-hidden="true" focusable="false" `),
    ]),
  );
  return (name) => icons.get(name.toLowerCase().replace(/\s/g, ""));
}
