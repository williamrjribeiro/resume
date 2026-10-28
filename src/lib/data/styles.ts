import type { WritingStyle } from "../styles.ts";

/**
 * The writing styles the page offers besides the original, in the order of the drop-down. Each one has a
 * folder of the same name in src/content/styles with a text for every page and entry that has one.
 */
export const writingStyles: ReadonlyArray<WritingStyle> = [
  { id: "asd-ste100", label: "Simplified Technical English (ASD-STE100)" },
  { id: "bob-ross", label: "Bob Ross" },
  { id: "business-writing", label: "Business writing" },
  { id: "corporate-communication", label: "Corporate communication" },
  { id: "google-dev-docs", label: "Google developer docs" },
  { id: "gov-uk", label: "GOV.UK" },
  { id: "jack-sparrow", label: "Jack Sparrow" },
  { id: "journalism-ap", label: "AP journalism" },
  { id: "orwells-rules", label: "Orwell's rules" },
  { id: "paddington", label: "Paddington" },
  { id: "plain-language", label: "Plain language" },
  { id: "scott-adams", label: "Scott Adams" },
  { id: "shrek", label: "Shrek" },
];
