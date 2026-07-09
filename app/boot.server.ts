import { lt } from "drizzle-orm";

import { createCronJob, Interval } from "~/core/.server/cron";
import { migrateDb } from "~/db/migrate.server";

import { fileStorage, removeFiles, shareKey } from "./core/.server/files";
import { db } from "./db/index.server";
import { shareTable } from "./db/schema.server";

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
