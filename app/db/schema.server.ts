import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { Json } from "~/core/json";

export const shareTable = sqliteTable("shares", {
  id: text().primaryKey(),
  content: text({ mode: "json" }).$type<Json>().notNull(),
  expiresAt: int({ mode: "timestamp" }).notNull(),
  createdAt: int({ mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
