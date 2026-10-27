export interface SocialProfile {
  readonly name: string;
  readonly user: string;
  readonly url: string;
}

export interface Language {
  readonly name: string;
  readonly level: string;
}

export interface Author {
  readonly name: string;
  readonly occupation: string;
  readonly locality: string;
  /** ISO 3166-1 alpha-2 code */
  readonly country: string;
  readonly countryName: string;
  readonly pronouns: string;
  readonly email: string;
  readonly telephone: string;
  readonly website: string;
  readonly skills: ReadonlyArray<string>;
  readonly languages: ReadonlyArray<Language>;
  readonly social: ReadonlyArray<SocialProfile>;
}

export const author: Author = {
  name: "William R. J. Ribeiro",
  occupation: "Principal Software Engineer",
  locality: "Lisbon",
  country: "PT",
  countryName: "Portugal",
  pronouns: "he/him",
  email: "william.ribeiro@gmail.com",
  telephone: "+351 912 856 244",
  website: "https://williamrjribeiro.github.io/resume/",
  skills: [
    "Leadership",
    "Coaching & Menthoring",
    "Automated testing",
    "Public speaking",
    "AWS",
    "React",
    "NextJS",
    "TypeScript",
    "Javascript / ES6",
    "NodeJS",
    "HTML",
    "CSS",
    "Git",
    "Go",
    "Kotlin",
    "Java",
  ],
  languages: [
    { name: "Portuguese", level: "native" },
    { name: "English", level: "fluent" },
    { name: "Spanish", level: "basic" },
    { name: "Dutch", level: "basic" },
  ],
  social: [
    { name: "Github", user: "@williamrjribeiro", url: "https://github.com/williamrjribeiro" },
    {
      name: "LinkedIn",
      user: "williamrjribeiro",
      url: "https://pt.linkedin.com/pub/william-r-j-ribeiro/47/186/568",
    },
    { name: "Twitter", user: "@bill_bsb", url: "https://twitter.com/bill_bsb" },
  ],
};
