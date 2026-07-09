import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { db } from "~/db/index.server";

export function migrateDb() {
  migrate(db, {
    migrationsFolder: "./drizzle",
  });
}
