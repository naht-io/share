import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "~/db/index.server";

migrate(db, {
  migrationsFolder: "./drizzle",
});
