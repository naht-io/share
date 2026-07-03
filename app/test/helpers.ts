import { Database } from "bun:sqlite";
import { mock } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

/**
 * Spins up a fresh in-memory SQLite database, applies the Drizzle migrations,
 * and mocks the `~/db/index.server` module so that route modules imported
 * afterwards talk to this isolated database instead of the real `share.db`.
 *
 * Must be called *before* dynamically importing the route under test so the
 * mock is registered ahead of the route's `import { db }`.
 */
export function mockDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle({ client: sqlite });
  migrate(db, { migrationsFolder: "./drizzle" });
  mock.module("~/db/index.server", () => ({ db }));
  return db;
}

/**
 * Awaits a promise expected to reject with a thrown `Response` (the way React
 * Router loaders/actions signal HTTP errors) and returns that response so the
 * caller can assert on its status. Fails if nothing, or something other than a
 * `Response`, is thrown.
 */
export async function catchResponse(promise: Promise<unknown>): Promise<Response> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
  throw new Error("Expected a Response to be thrown, but the call resolved");
}
