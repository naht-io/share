import { Database } from "bun:sqlite";
import { beforeEach, mock } from "bun:test";
import { createMemoryFileStorage } from "@remix-run/file-storage/memory";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { reset } from "drizzle-seed";

import * as schema from "~/db/schema.server";
import * as files from "~/core/.server/files";

// Shrink the upload limits before any route module loads (they are read at
// module scope), so oversize tests don't need to allocate 50 MB buffers.
process.env.MAX_FILE_SIZE = String(1024 * 1024);
process.env.MAX_UPLOAD_SIZE = String(2 * 1024 * 1024);

// Spin up a single in-memory database and apply the Drizzle migrations. This
// runs before any test file is loaded, so mocking `~/db/index.server` here means
// route modules statically imported by the tests resolve to this database
// instead of the real `share.db`.
const sqlite = new Database(":memory:");
const db = drizzle({ client: sqlite });
migrate(db, { migrationsFolder: "./drizzle" });
mock.module("~/db/index.server", () => ({ db }));

// Swap the filesystem-backed storage for an in-memory one, same trick as the
// database above. Route modules import the instance via `~/core/files/index.server`,
// which re-exports it from this module.
const fileStorage = createMemoryFileStorage();
mock.module("~/core/.server/files", () => ({ ...files, fileStorage }));

// Truncate every table and empty the file storage before each test so cases
// stay isolated from one another.
beforeEach(async () => {
  await reset(db, schema);
  const { files } = await fileStorage.list();
  for (const { key } of files) {
    await fileStorage.remove(key);
  }
});
