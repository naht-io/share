import { mock } from "bun:test";
import { describe, expect, test } from "bun:test";

import { generateId } from "~/core/ids";
import { shareTable } from "~/db/schema.server";
import { catchResponse, mockDb } from "~/test/helpers";

// Mock the database, and stub the heavy Editor component (which s.tsx imports
// for its page render) so the loader can be exercised in isolation.
const db = mockDb();
mock.module("~/components/Editor", () => ({ Editor: () => null }));
const { loader } = await import("~/routes/s");

type LoaderArgs = Parameters<typeof loader>[0];

function callLoader(id: string) {
  return loader({ params: { id } } as unknown as LoaderArgs);
}

describe("s loader", () => {
  test("should return data on success", async () => {
    const id = generateId();
    // Use whole-second timestamps: Drizzle stores `timestamp` columns as unix
    // seconds, so sub-second precision would not survive the round-trip.
    const nowSeconds = Math.floor(Date.now() / 1000) * 1000;
    const createdAt = new Date(nowSeconds);
    const expiresAt = new Date(nowSeconds + 24 * 60 * 60 * 1000);
    const content = { type: "doc", content: [{ type: "paragraph" }] };

    await db.insert(shareTable).values({ id, content, createdAt, expiresAt });

    const result = await callLoader(id);

    expect(result.data.content).toEqual(content);
    expect(result.data.createdAt).toBe(createdAt.toISOString());
    expect(result.data.expiresAt).toBe(expiresAt.toISOString());
  });

  test("should 404 on invalid url", async () => {
    const response = await catchResponse(callLoader("does-not-exist"));
    expect(response.status).toBe(404);
  });
});
