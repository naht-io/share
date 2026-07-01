import { lt } from "drizzle-orm";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";

// Purge expired shares every hour
setInterval(purgeExpired, 60 * 60 * 1000).unref?.();
void purgeExpired();

async function purgeExpired() {
  try {
    await db.delete(shareTable).where(lt(shareTable.expiresAt, new Date()));
  } catch (error) {
    console.error("Failed to purge expired shares:", error);
  }
}
