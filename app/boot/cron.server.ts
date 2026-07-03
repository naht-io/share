import { lt } from "drizzle-orm";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";

declare global {
  var __purgeCronStarted: boolean | undefined;
}

// Purge expired shares every day
if (!globalThis.__purgeCronStarted) {
  globalThis.__purgeCronStarted = true;
  setInterval(purgeExpired, 24 * 60 * 60 * 1000).unref?.();
  void purgeExpired();
}

async function purgeExpired() {
  try {
    await db.delete(shareTable).where(lt(shareTable.expiresAt, new Date()));
  } catch (error) {
    console.error("Failed to purge expired shares:", error);
  }
}
