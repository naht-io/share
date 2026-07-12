import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { Json } from "~/core/json";

export const shareTable = sqliteTable(
  "shares",
  {
    id: text().primaryKey(),
    content: text({ mode: "json" }).$type<Json>().notNull(),
    expiresAt: int({ mode: "timestamp" }).notNull(),
    createdAt: int({ mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("shares_expires_at_idx").on(table.expiresAt)],
);

export const submissionTable = sqliteTable(
  "submissions",
  {
    id: int().primaryKey({ autoIncrement: true }),
    shareId: text()
      .notNull()
      .references(() => shareTable.id, { onDelete: "cascade" }),
    data: text({ mode: "json" }).$type<Json>().notNull(),
    createdAt: int({ mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("submissions_share_id_idx").on(table.shareId)],
);
