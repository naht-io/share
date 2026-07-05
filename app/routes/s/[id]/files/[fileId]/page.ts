import { and, eq, gt } from "drizzle-orm";

import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";
import { fileKey, fileStorage } from "~/core/.server/files";

import type { Route } from "./+types/page";

export async function loader({ params }: Route.LoaderArgs) {
  const { id, fileId } = params;

  const [share] = await db
    .select({ id: shareTable.id })
    .from(shareTable)
    .where(and(eq(shareTable.id, id), gt(shareTable.expiresAt, new Date())))
    .limit(1);
  if (!share) {
    throw new Response(null, { status: 404 });
  }

  const file = await fileStorage.get(fileKey(id, fileId));
  if (!file) {
    throw new Response(null, { status: 404 });
  }

  return new Response(file.stream(), {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    },
  });
}
