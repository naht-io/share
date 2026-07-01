import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

let db: ReturnType<typeof drizzle>;

export function getDb() {
  if (!db) {
    db = drizzle(process.env.DB_FILE ?? "share.db");
    migrate(db, {
      migrationsFolder: "./drizzle",
    });
  }
  return db;
}
