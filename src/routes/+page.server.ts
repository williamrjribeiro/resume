import { resume } from "#lib/server/resume.ts";
import type { PageServerLoad } from "./$types";

// Runs once, when the site is prerendered, so `builtAt` is the time of the build.
export const load: PageServerLoad = () => ({ resume, builtAt: new Date().toISOString() });
