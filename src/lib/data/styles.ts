import type { Theme, WritingStyle } from "../styles.ts";

// A theme is the palette of a character, written the way Toon Tone describes palettes
// (https://toontone.io/blog/memorable-character-color-palettes/): a few reviewed colour parts, in one of four
// structures, one loud dominant colour, a two-colour split, a dark base with a small accent, or nearby muted
// tones. Where that catalogue has the character (Shrek) or a fitting one (Sung Jinwoo, Maomao, Levi Ackerman,
// Bluey, Mega Man, Batman), the parts are its own. For the others the parts are reviewed the same way, as HSB
// values of the costume, and then kept apart from the text colours: a part keeps its hue and saturation and
// loses brightness until the text on it reads.
//
// The roles: `primary` is the dominant part, `secondary` the next, `accent` and `highlight` the small ones, and
// `sidebar` the dark stops of the moving gradient. src/lib/themes.test.ts checks the contrast of each role.

const asd: Theme = {
  // Aircraft manuals: a two-colour split (navy and Mega Man blue), a WARNING red and a CAUTION amber.
  primary: "#3262a6",
  secondary: "#d97706",
  accent: "#c62828",
  highlight: "#5c94cc",
  sidebar: ["#0f2547", "#3262a6", "#a32222", "#b45309"],
  paper: "#f7f9fc",
  tint: "#e3e9f2",
  ink: "#1a2433",
};
const bobRoss: Theme = {
  // Dark base and paint accents: denim shirt, alizarin crimson, sap green, cadmium yellow, Van Dyke brown hair.
  primary: "#385b8c",
  secondary: "#b2243c",
  accent: "#50783c",
  highlight: "#d1b43f",
  sidebar: ["#402a1d", "#385b8c", "#50783c", "#b2243c", "#a38a1c"],
  paper: "#faf7ed",
  tint: "#ece6d3",
  ink: "#2b2118",
};
const business: Theme = {
  // Sung Jinwoo's dark base (#21242e, #222c47) with a blue accent (#3d8bd9), and a boardroom gold.
  primary: "#1f3a6e",
  secondary: "#8a6d3b",
  accent: "#3d8bd9",
  highlight: "#7d8590",
  sidebar: ["#21242e", "#222c47", "#1f3a6e", "#3d8bd9"],
  paper: "#f8f9fb",
  tint: "#e6e9ee",
  ink: "#1d2433",
};
const corporate: Theme = {
  // Maomao's nearby tones: forest (#29473b), teal (#518c86), lavender (#7c78b3), and a warm terracotta.
  primary: "#2e6e69",
  secondary: "#d1603d",
  accent: "#7c78b3",
  highlight: "#518c86",
  sidebar: ["#29473b", "#2e6e69", "#518c86", "#7c78b3", "#b0522f"],
  paper: "#f7fbfb",
  tint: "#e1eeee",
  ink: "#1b2b28",
};
const googleDocs: Theme = {
  // Google's four colours, darkened until the text on them reads.
  primary: "#1967d2",
  secondary: "#c5221f",
  accent: "#f29900",
  highlight: "#188038",
  sidebar: ["#174ea6", "#c5221f", "#b06000", "#188038"],
  paper: "#ffffff",
  tint: "#e8f0fe",
  ink: "#202124",
};
const govUk: Theme = {
  // The GOV.UK palette: blue, red, green, orange, black, and the light grey of its pages.
  primary: "#1d70b8",
  secondary: "#d4351c",
  accent: "#00703c",
  highlight: "#f47738",
  sidebar: ["#0b0c0c", "#003078", "#1d70b8", "#00703c"],
  paper: "#ffffff",
  tint: "#f3f2f1",
  ink: "#0b0c0c",
};
const jackSparrow: Theme = {
  // Dark base with small accents: coat (#241d19), bandana red, gold trinkets, Caribbean sea green.
  primary: "#b22428",
  secondary: "#ab8933",
  accent: "#cca43d",
  highlight: "#2e6658",
  sidebar: ["#241d19", "#b22428", "#b28f36", "#2e6658"],
  paper: "#faf5ed",
  tint: "#ece1cd",
  ink: "#2b261c",
};
const ap: Theme = {
  // Newsprint: Deadpool's red against black, Batman's charcoal (#676d73), and a wire-service blue.
  primary: "#c8102e",
  secondary: "#1a1a1a",
  accent: "#676d73",
  highlight: "#1f5fa8",
  sidebar: ["#111111", "#676d73", "#c8102e", "#6b0f1a"],
  paper: "#fdfcf8",
  tint: "#eeeeee",
  ink: "#111111",
};
const orwell: Theme = {
  // Levi Ackerman's muted tones: olive (#4a593c), brown (#7a634c), bone (#e0daca), and a poster red.
  primary: "#4a593c",
  secondary: "#a4161a",
  accent: "#7a634c",
  highlight: "#b89b5e",
  sidebar: ["#1f2328", "#4a593c", "#7a634c", "#a4161a", "#8c7438"],
  paper: "#f5f4f1",
  tint: "#e0daca",
  ink: "#22251f",
};
const paddington: Theme = {
  // A two-colour split and more: the red hat, the blue duffle coat, the brown fur, the marmalade.
  primary: "#b22430",
  secondary: "#613d1d",
  accent: "#2c5894",
  highlight: "#d18a1f",
  sidebar: ["#613d1d", "#b22430", "#2c5894", "#c9851e", "#3f2a15"],
  paper: "#fcf6ee",
  tint: "#ece0cf",
  ink: "#2a1c12",
};
const plain: Theme = {
  // Bluey's blue (#5995b3) and sand (#d9ad82), with the blue darkened for text.
  primary: "#2a6f93",
  secondary: "#b8742b",
  accent: "#5995b3",
  highlight: "#d9ad82",
  sidebar: ["#1d4f6b", "#2a6f93", "#5995b3", "#b8742b", "#a67f4b"],
  paper: "#f9fcfe",
  tint: "#e4eef4",
  ink: "#1c2a33",
};
const scottAdams: Theme = {
  // The Dilbert strip's office: a dark base with an orange accent, blue shirts, cubicle gray and beige.
  primary: "#2e4c73",
  secondary: "#d9742b",
  accent: "#e67a2e",
  highlight: "#b9a77c",
  sidebar: ["#242629", "#2e4c73", "#e0782d", "#7e8c88"],
  paper: "#faf6ed",
  tint: "#ebe0ca",
  ink: "#262a31",
};
const shrek: Theme = {
  // Shrek in the catalogue: green (#4f8c31) and brown (#66523d), with the tunic's gold.
  primary: "#477d2c",
  secondary: "#66523d",
  accent: "#4f8c31",
  highlight: "#c8a24a",
  sidebar: ["#2a4a14", "#4f8c31", "#66523d", "#a69356"],
  paper: "#f5faed",
  tint: "#e0ecd0",
  ink: "#252b1c",
};
const tedLasso: Theme = {
  // A two-colour split: Richmond sky blue and navy, and the yellow of the "Believe" sign.
  primary: "#3b72a8",
  secondary: "#a18a18",
  accent: "#4c92d9",
  highlight: "#d4b300",
  sidebar: ["#143666", "#4c92d9", "#ab931a", "#0f2a52"],
  paper: "#edf4fa",
  tint: "#d6e4f1",
  ink: "#1c242b",
};
const pooh: Theme = {
  // A two-colour split: the red shirt and the honey, with the honey pot's brown and the Hundred Acre green.
  primary: "#cc271f",
  secondary: "#bd8413",
  accent: "#e6a117",
  highlight: "#5d8c4d",
  sidebar: ["#734e34", "#cc271f", "#c48914", "#5d8c4d"],
  paper: "#fff9ea",
  tint: "#f1e6c8",
  ink: "#2b271c",
};
const yoda: Theme = {
  // Nearby muted tones with a small accent: sage skin, robe tan and brown, and the lightsaber's green.
  primary: "#4f7a3a",
  secondary: "#7a5d43",
  accent: "#8ea66c",
  highlight: "#1dbf2a",
  sidebar: ["#1a2a1d", "#4f7a3a", "#859c65", "#7a5d43", "#1aab26"],
  paper: "#f4faf0",
  tint: "#e0eed7",
  ink: "#212b1c",
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
