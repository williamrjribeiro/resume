import { obfuscate } from "./format.ts";

export interface EmailLinkOptions {
  readonly email: string;
  /** What the link is for ("Email"); spoken when the link shows no text of its own. */
  readonly label: string;
  /** The inline SVG shown in front of the address. */
  readonly icon?: string | undefined;
  /** Shows the address after the icon. Without it the link is an icon button named by `label`. */
  readonly showText?: boolean;
  readonly className?: string;
}

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * A `mailto:` link whose address is spelled as HTML entities in the link and in its text, which keeps
 * it out of naive scrapers. Svelte would escape those entities again, so the link is built as HTML:
 * everything but the entities and the icon is escaped here.
 */
export function emailLinkHtml({
  email,
  label,
  icon = "",
  showText = false,
  className = "",
}: EmailLinkOptions): string {
  const address = obfuscate(email);
  const attributes = showText ? "" : ` aria-label="${escapeHtml(label)}"`;
  const text = showText ? `<span>${address}</span>` : "";
  return `<a class="${escapeHtml(className)}" href="mailto:${address}"${attributes}>${icon}${text}</a>`;
}
