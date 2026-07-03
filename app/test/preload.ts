import { Database } from "bun:sqlite";
import { beforeEach, mock } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { reset } from "drizzle-seed";

import * as schema from "~/db/schema.server";

// Spin up a single in-memory database and apply the Drizzle migrations. This
// runs before any test file is loaded, so mocking `~/db/index.server` here means
// route modules statically imported by the tests resolve to this database
// instead of the real `share.db`.
const sqlite = new Database(":memory:");
const db = drizzle({ client: sqlite });
migrate(db, { migrationsFolder: "./drizzle" });

mock.module("~/db/index.server", () => ({ db }));

// Truncate every table before each test so cases stay isolated from one another.
beforeEach(async () => {
  await reset(db, schema);
});
