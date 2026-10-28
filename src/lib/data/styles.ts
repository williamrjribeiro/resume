import type { WritingStyle } from "../styles.ts";

/**
 * The writing styles the page offers besides the original, in the order of the drop-down. Each one has a
 * folder of the same name in src/content/styles with a text for every page and entry that has one.
 */
export const writingStyles: ReadonlyArray<WritingStyle> = [
  { id: "asd-ste100", label: "Simplified Technical English (ASD-STE100)" },
];
