export const site = {
  url: "https://williamrjribeiro.github.io/resume/",
  lang: "en",
  locale: "en_US",
  colors: { primary: "#005b96", secondary: "#fc6767" },
} as const;

export const strings = {
  titles: {
    experience: "Work Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    apps: "Open Source Projects",
    volunteering: "Volunteering",
  },
  labels: {
    email: "Email",
    telephone: "Telephone",
    print: "Print Résumé",
    present: "Present",
    lastUpdated: "Last updated",
    sourceCode: "Source",
    appStore: "Store",
    scrollToTop: "Scroll to top",
    writingStyle: "Writing style",
    inStyleOf: "In the style of",
    styleLoading: "Rewriting the résumé…",
    styleFailed: "That style could not be loaded, so the original stays.",
  },
} as const;
