import { writingStyles } from "#lib/data/styles.ts";
import { styles } from "#lib/server/resume.ts";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

// One file per writing style, written to styles/<id>.json when the site is prerendered. The page
// downloads the one the visitor picks.
export const prerender = true;

export const entries = (): Array<{ id: string }> => writingStyles.map(({ id }) => ({ id }));

export const GET: RequestHandler = ({ params }) => {
  const style = styles[params["id"] ?? ""];
  if (style === undefined) {
    error(404, "No such writing style");
  }
  return json(style);
};
