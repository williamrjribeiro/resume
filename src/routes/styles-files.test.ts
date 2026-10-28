/** The text of the writing styles, as the route serves it to the page. */
import { describe, expect, it } from "bun:test";
import { writingStyles } from "#lib/data/styles.ts";
import { styles } from "#lib/server/resume.ts";
import { entries, GET } from "./styles/[id].json/+server.ts";

// A route handler takes the request event, of which this one reads only the parameters.
const call = (id: string) => GET({ params: { id } } as never);

describe("the writing style files", () => {
  it("are written for every style on offer, and for no other", () => {
    expect(entries()).toEqual(writingStyles.map(({ id }) => ({ id })));
  });

  describe.each(writingStyles.map(({ id }) => id))("%s.json", (id) => {
    it("is JSON with the text of the style", async () => {
      const response = await call(id);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toEqual(styles[id]);
    });
  });

  it("do not exist for a style that is not on offer", async () => {
    let status = 0;
    try {
      await call("nope");
    } catch (thrown) {
      status = (thrown as { status: number }).status;
    }
    expect(status).toBe(404);
  });
});
