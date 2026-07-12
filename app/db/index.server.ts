import { Database } from "bun:sqlite";

import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database(process.env.DB_FILE ?? "share.db");
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA busy_timeout = 5000;");
// SQLite ships with foreign keys off; the schema relies on ON DELETE CASCADE
// (shares -> submissions).
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle({ client: sqlite });
