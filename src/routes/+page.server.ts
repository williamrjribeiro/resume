import { resume } from "#lib/server/resume.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => ({ resume });
