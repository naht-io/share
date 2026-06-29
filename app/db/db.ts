import { drizzle } from "drizzle-orm/node-sqlite";

export const db = drizzle(process.env.DB_FILE_NAME!);
