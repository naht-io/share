import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { eq } from "drizzle-orm";

import { ShareExpiry } from "~/core/expiry";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";
import { action } from "~/routes/s/page";
import { catchResponse } from "~/test/utils";

describe("s/", () => {
  describe("action", () => {
    const validContent = { type: "doc", content: [{ type: "paragraph" }] };
    // A fixed whole-second instant: SQLite timestamps have second resolution,
    // so this round-trips through the database without losing precision.
    const now = new Date("2026-07-03T12:00:00Z");

    afterEach(() => {
      setSystemTime();
    });

    test("should return redirect on success", async () => {
      const response = await action(
        getActionParams(
          JSON.stringify({
            content: validContent,
            expiry: ShareExpiry.TOMORROW,
          }),
        ),
      );

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toMatch(/^\/s\/.+/);
    });

    test("should persist share on success", async () => {
      setSystemTime(now);
      const response = await action(
        getActionParams(
          JSON.stringify({
            content: validContent,
            expiry: ShareExpiry.TOMORROW,
          }),
        ),
      );

      const id = response.headers.get("location")!.replace("/s/", "");
      const [row] = await db.select().from(shareTable).where(eq(shareTable.id, id));
      expect(row.content).toEqual(validContent);
      expect(row.expiresAt).toEqual(new Date("2026-07-04T12:00:00Z"));
    });

    test("should 400 on invalid json", async () => {
      const response = await catchResponse(action(getActionParams("not json{")));
      expect(response.status).toBe(400);
    });

    test("should 400 on missing content", async () => {
      const response = await catchResponse(
        action(getActionParams(JSON.stringify({ expiry: ShareExpiry.TOMORROW }))),
      );
      expect(response.status).toBe(400);
    });

    test("should 400 on invalid content", async () => {
      const response = await catchResponse(
        action(
          getActionParams(
            JSON.stringify({
              content: { type: "not-a-doc" },
              expiry: ShareExpiry.TOMORROW,
            }),
          ),
        ),
      );
      expect(response.status).toBe(400);
    });

    test("should 400 on missing expiry", async () => {
      const response = await catchResponse(
        action(getActionParams(JSON.stringify({ content: validContent }))),
      );
      expect(response.status).toBe(400);
    });

    test("should 400 on invalid expiry", async () => {
      const response = await catchResponse(
        action(
          getActionParams(
            JSON.stringify({
              content: validContent,
              expiry: ShareExpiry.NEVER,
            }),
          ),
        ),
      );
      expect(response.status).toBe(400);
    });

    test("should 413 (payload too large) if content-length too big", async () => {
      const tooBig = "x".repeat(256 * 1024 + 1);
      const response = await catchResponse(
        action(
          getActionParams(tooBig, {
            "content-length": String(Buffer.byteLength(tooBig)),
          }),
        ),
      );
      expect(response.status).toBe(413);
    });

    test("should 413 (payload too large) if body too big without content-length", async () => {
      const tooBig = "x".repeat(256 * 1024 + 1);
      const response = await catchResponse(action(getActionParams(tooBig)));
      expect(response.status).toBe(413);
    });
  });
});

function getActionParams(body: string, headers: Record<string, string> = {}): ActionArgs {
  const request = new Request("http://localhost/share", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
  return { request } as unknown as ActionArgs;
}

type ActionArgs = Parameters<typeof action>[0];
