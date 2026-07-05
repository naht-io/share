import { lt } from "drizzle-orm";

import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";
import { removeShareFiles } from "~/files/index.server";

export async function purgeExpired() {
  try {
    const expired = await db
      .delete(shareTable)
      .where(lt(shareTable.expiresAt, new Date()))
      .returning({ id: shareTable.id });

    for (const { id } of expired) {
      try {
        await removeShareFiles(id);
      } catch (error) {
        console.error(`Failed to remove files for purged share ${id}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to purge expired shares:", error);
  }
}
