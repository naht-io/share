import { lt } from "drizzle-orm";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";

declare global {
  // Guards against stacking intervals when Vite re-evaluates this module on HMR.
  var __purgeCronStarted: boolean | undefined;
}

// Expired shares are filtered out at read time, so a daily purge is enough.
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
