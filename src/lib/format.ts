/** `2013-01-01` → `01/2013`. Dates are `yyyy-MM-dd` strings, so no time zone can shift them. */
export function formatMonthYear(date: string): string {
  const [year, month] = date.split("-");
  return `${month}/${year}`;
}

/** An ISO timestamp → `dd.MM.yyyy`, in UTC. */
export function formatBuildDate(timestamp: string): string {
  const [year, month, day] = timestamp.slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}

export function stripSpaces(text: string): string {
  return text.replace(/\s/g, "");
}

export function stripProtocol(url: string): string {
  return url.replace(/^\w+:\/\//, "");
}

/** Spells every character as an HTML entity, which keeps the address out of naive scrapers. */
export function obfuscate(text: string): string {
  return Array.from(text, (char) => `&#${char.codePointAt(0)};`).join("");
}
