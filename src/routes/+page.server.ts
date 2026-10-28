import type { ServerLoad } from "@sveltejs/kit";
import { resume } from "#lib/server/resume.ts";

// The types come from `@sveltejs/kit`, not from `./$types`: SvelteKit writes `./$types` only when the
// `typescript` package is installed, which this project leaves out (`bun check` type checks).

// Runs once, when the site is prerendered, so `builtAt` is the time of the build.
export const load = (() => ({ resume, builtAt: new Date().toISOString() })) satisfies ServerLoad;
