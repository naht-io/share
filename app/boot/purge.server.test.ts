import { describe, expect, test } from "bun:test";
import { addDays, subDays } from "date-fns";
import { eq } from "drizzle-orm";

import { purgeExpired } from "~/boot/purge.server";
import { generateId } from "~/core/ids";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";
import { fileKey, fileStorage } from "~/files/index.server";

describe("purgeExpired", () => {
  const content = { type: "doc", content: [] };

  async function seedShare(expiresAt: Date, fileCount: number): Promise<string> {
    const id = generateId();
    await db.insert(shareTable).values({ id, content, expiresAt });
    for (let i = 0; i < fileCount; i++) {
      await fileStorage.set(fileKey(id, generateId()), new File([`data-${i}`], `file-${i}.txt`));
    }
    return id;
  }

  test("should delete expired shares along with their files", async () => {
    const expiredId = await seedShare(subDays(new Date(), 1), 2);
    const liveId = await seedShare(addDays(new Date(), 1), 1);

    await purgeExpired();

    const expiredRows = await db.select().from(shareTable).where(eq(shareTable.id, expiredId));
    expect(expiredRows).toHaveLength(0);
    const expiredFiles = await fileStorage.list({ prefix: `${expiredId}/` });
    expect(expiredFiles.files).toHaveLength(0);

    const liveRows = await db.select().from(shareTable).where(eq(shareTable.id, liveId));
    expect(liveRows).toHaveLength(1);
    const liveFiles = await fileStorage.list({ prefix: `${liveId}/` });
    expect(liveFiles.files).toHaveLength(1);
  });

  test("should handle expired shares without files", async () => {
    const expiredId = await seedShare(subDays(new Date(), 1), 0);

    await purgeExpired();

    const rows = await db.select().from(shareTable).where(eq(shareTable.id, expiredId));
    expect(rows).toHaveLength(0);
  });
});
