import { describe, expect, test } from "bun:test";

import { eq } from "drizzle-orm";

import { generateId } from "~/core/id";
import { db } from "~/db/index.server";
import { shareTable, submissionTable } from "~/db/schema.server";

describe("submissions", () => {
  // The purge job relies on this cascade; it only fires when the connection
  // enables PRAGMA foreign_keys (see index.server.ts and test/preload.ts).
  test("should be deleted when their share is deleted", async () => {
    const id = generateId();
    await db.insert(shareTable).values({
      id,
      content: { type: "doc", content: [] },
      expiresAt: new Date(Date.now() + 1000),
    });
    await db.insert(submissionTable).values({ shareId: id, data: { a: "b" } });

    await db.delete(shareTable).where(eq(shareTable.id, id));

    const rows = await db.select().from(submissionTable).where(eq(submissionTable.shareId, id));
    expect(rows).toHaveLength(0);
  });
});
