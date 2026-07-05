import { migrateDb } from "~/db/migrate.server";
import { createCronJob, Interval } from "~/core/.server/cron";
import { db } from "./db/index.server";
import { shareTable } from "./db/schema.server";
import { lt } from "drizzle-orm";
import { fileStorage, removeFiles, shareKey } from "./core/.server/files";

// Migrate the database.
migrateDb();

// Purge expired shares every day.
createCronJob(
  "purge",
  async () => {
    const expired = await db
      .delete(shareTable)
      .where(lt(shareTable.expiresAt, new Date()))
      .returning({ shareId: shareTable.id });

    for (const { shareId } of expired) {
      await removeFiles(fileStorage, shareKey(shareId));
    }
  },
  Interval.DAY,
);
