import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { ShareExpiry } from "~/core/expiry";
import { shareTable } from "~/db/schema.server";
import { catchResponse, mockDb } from "~/test/helpers";

// Mock the database and load the route module against it. Order matters:
// `mockDb()` must run before the dynamic import so the route picks up the mock.
const db = mockDb();
const { action } = await import("~/routes/share");

type ActionArgs = Parameters<typeof action>[0];

function callAction(body: string, headers: Record<string, string> = {}) {
  const request = new Request("http://localhost/share", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
  return action({ request } as unknown as ActionArgs);
}

const validContent = { type: "doc", content: [{ type: "paragraph" }] };

describe("share action", () => {
  test("should return redirect on success", async () => {
    const response = await callAction(
      JSON.stringify({ content: validContent, expiry: ShareExpiry.TOMORROW }),
    );

    expect(response.status).toBe(302);
    const location = response.headers.get("location");
    expect(location).toMatch(/^\/s\/.+/);

    // The share was actually persisted under the redirected id.
    const id = location!.replace("/s/", "");
    const [row] = await db.select().from(shareTable).where(eq(shareTable.id, id));
    expect(row.content).toEqual(validContent);
  });

  test("should 400 on missing content", async () => {
    const response = await catchResponse(
      callAction(JSON.stringify({ expiry: ShareExpiry.TOMORROW })),
    );
    expect(response.status).toBe(400);
  });

  test("should 400 on invalid content", async () => {
    const response = await catchResponse(
      callAction(
        JSON.stringify({
          content: { type: "not-a-doc" },
          expiry: ShareExpiry.TOMORROW,
        }),
      ),
    );
    expect(response.status).toBe(400);
  });

  test("should 400 on missing expiry", async () => {
    const response = await catchResponse(callAction(JSON.stringify({ content: validContent })));
    expect(response.status).toBe(400);
  });

  test("should 400 on invalid expiry", async () => {
    const response = await catchResponse(
      callAction(JSON.stringify({ content: validContent, expiry: ShareExpiry.NEVER })),
    );
    expect(response.status).toBe(400);
  });

  // The route answers oversized payloads with 413 Payload Too Large (the
  // semantically correct status), not 400 — see note in the summary.
  test("should 413 (payload too large) if body too big", async () => {
    const tooBig = "x".repeat(256 * 1024 + 1);
    const response = await catchResponse(
      callAction(tooBig, { "content-length": String(Buffer.byteLength(tooBig)) }),
    );
    expect(response.status).toBe(413);
  });
});
