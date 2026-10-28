import type { Theme, WritingStyle } from "../styles.ts";

// Each theme is the palette of the character or the look of the style. Text must stay readable on it, which
// src/lib/themes.test.ts checks: `primary` needs 4.5:1 on `paper`, `secondary` 3:1, and the two ends of the
// gradient 3:1 against the white icons that sit on it.
const asd: Theme = {
  // Aircraft documentation: navy panels, an amber warning light.
  primary: "#1b3a6b",
  secondary: "#d97706",
  gradientFrom: "#0f2547",
  gradientTo: "#2f6db5",
  paper: "#f7f9fc",
  tint: "#e3e9f2",
};
const bobRoss: Theme = {
  // The painter's palette: phthalo blue, alizarin crimson, sap green, Van Dyke brown, titanium white.
  primary: "#0b5563",
  secondary: "#a62639",
  gradientFrom: "#4e7a1f",
  gradientTo: "#7a4a21",
  paper: "#fbfaf5",
  tint: "#ece8dc",
};
const business: Theme = {
  // Boardroom navy with a muted gold.
  primary: "#1c3557",
  secondary: "#8a6d3b",
  gradientFrom: "#0e1f38",
  gradientTo: "#4a6a94",
  paper: "#f8f9fb",
  tint: "#e6e9ee",
};
const corporate: Theme = {
  // A calm teal with a warm terracotta.
  primary: "#0e6370",
  secondary: "#d1603d",
  gradientFrom: "#0a4a55",
  gradientTo: "#3a9aa6",
  paper: "#f7fbfb",
  tint: "#e1eeee",
};
const googleDocs: Theme = {
  // Google's blue, red and green, darkened until the text on them reads.
  primary: "#1967d2",
  secondary: "#b06000",
  gradientFrom: "#c5221f",
  gradientTo: "#188038",
  paper: "#ffffff",
  tint: "#e8f0fe",
};
const govUk: Theme = {
  // The GOV.UK palette: blue links, a red, dark blue and green, and the light grey of its pages.
  primary: "#1d70b8",
  secondary: "#d4351c",
  gradientFrom: "#003078",
  gradientTo: "#00703c",
  paper: "#ffffff",
  tint: "#f3f2f1",
};
const jackSparrow: Theme = {
  // Black sails, leather, a bandana red, old gold, parchment.
  primary: "#5b3a1e",
  secondary: "#a67c00",
  gradientFrom: "#111111",
  gradientTo: "#8b1a1a",
  paper: "#fbf7ef",
  tint: "#ebdfc7",
};
const ap: Theme = {
  // Newsprint: black ink, a wire-service red.
  primary: "#c8102e",
  secondary: "#1a1a1a",
  gradientFrom: "#111111",
  gradientTo: "#6b0f1a",
  paper: "#fdfcf8",
  tint: "#eeeeee",
};
const orwell: Theme = {
  // A drab slate and the red of a poster on a wall.
  primary: "#3b4754",
  secondary: "#a4161a",
  gradientFrom: "#1f2328",
  gradientTo: "#7d1d20",
  paper: "#f5f4f1",
  tint: "#e1ded8",
};
const paddington: Theme = {
  // The red hat, the brown duffle coat and fur, the marmalade, a cream page.
  primary: "#b01c2e",
  secondary: "#8b5a2b",
  gradientFrom: "#5c3a1e",
  gradientTo: "#b4551a",
  paper: "#fffaf3",
  tint: "#f0e3d2",
};
const plain: Theme = {
  // A clear blue with a friendly green.
  primary: "#2a5ea8",
  secondary: "#3a9d6e",
  gradientFrom: "#1b3f73",
  gradientTo: "#3a9d6e",
  paper: "#fafcff",
  tint: "#e5ecf6",
};
const scottAdams: Theme = {
  // The Dilbert strip: office orange and navy on the beige of a cubicle.
  primary: "#c2410c",
  secondary: "#1f3a5f",
  gradientFrom: "#7c2d12",
  gradientTo: "#d9731a",
  paper: "#faf6ee",
  tint: "#eadfc8",
};
const shrek: Theme = {
  // Ogre green, the brown of the vest, swamp light.
  primary: "#3d7a0a",
  secondary: "#7a4a1f",
  gradientFrom: "#24400f",
  gradientTo: "#6b9b1f",
  paper: "#f7faef",
  tint: "#e2ebcf",
};
const tedLasso: Theme = {
  // AFC Richmond's sky blue and navy, and the gold of the "Believe" sign.
  primary: "#0f4c8a",
  secondary: "#a67c00",
  gradientFrom: "#0a2d57",
  gradientTo: "#3c8fd4",
  paper: "#f8fbff",
  tint: "#e2edf8",
};
const pooh: Theme = {
  // The red shirt and honey, on a honey-cream page.
  primary: "#b0301f",
  secondary: "#b7791f",
  gradientFrom: "#8f2418",
  gradientTo: "#c27d0e",
  paper: "#fffaec",
  tint: "#f6e8c3",
};
const yoda: Theme = {
  // Yoda's green skin and the tan of his robe.
  primary: "#3a7d4e",
  secondary: "#9c7a4c",
  gradientFrom: "#1f4d33",
  gradientTo: "#6f9f5f",
  paper: "#f6faf4",
  tint: "#e1ecdc",
};

/**
 * The writing styles the page offers besides the original, in the order of the drop-down. Each one has a
 * folder of the same name in src/content/styles with a text for every page and entry that has one.
 */
export const writingStyles: ReadonlyArray<WritingStyle> = [
  { id: "asd-ste100", label: "Simplified Technical English (ASD-STE100)", theme: asd },
  { id: "bob-ross", label: "Bob Ross", theme: bobRoss },
  { id: "business-writing", label: "Business writing", theme: business },
  { id: "corporate-communication", label: "Corporate communication", theme: corporate },
  { id: "google-dev-docs", label: "Google developer docs", theme: googleDocs },
  { id: "gov-uk", label: "GOV.UK", theme: govUk },
  { id: "jack-sparrow", label: "Jack Sparrow", theme: jackSparrow },
  { id: "journalism-ap", label: "AP journalism", theme: ap },
  { id: "orwells-rules", label: "Orwell's rules", theme: orwell },
  { id: "paddington", label: "Paddington", theme: paddington },
  { id: "plain-language", label: "Plain language", theme: plain },
  { id: "scott-adams", label: "Scott Adams", theme: scottAdams },
  { id: "shrek", label: "Shrek", theme: shrek },
  { id: "ted-lasso", label: "Ted Lasso", theme: tedLasso },
  { id: "winnie-the-pooh", label: "Winnie the Pooh", theme: pooh },
  { id: "yoda", label: "Yoda", theme: yoda },
];
