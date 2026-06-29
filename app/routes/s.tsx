import type { Content } from "@tiptap/react";
import { formatDistanceToNow } from "date-fns";
import { eq } from "drizzle-orm";
import { NavLink } from "react-router";

import { Editor } from "~/components/Editor";
import { db } from "~/db/db";
import { shareTable } from "~/db/schema";

import type { Route } from "./+types/s";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Response("ID is required", { status: 400 });
  }

  const [share] = await db
    .select({
      content: shareTable.content,
      createdAt: shareTable.createdAt,
      expiresAt: shareTable.expiresAt,
    })
    .from(shareTable)
    .where(eq(shareTable.id, id))
    .limit(1);
  if (!share) {
    throw new Response(null, { status: 404 });
  }

  return {
    data: {
      content: share.content,
      created_at: share.createdAt.toISOString(),
      expires_at: share.expiresAt.toISOString(),
    },
  };
}

export default function SharePage({ loaderData }: Route.ComponentProps) {
  const share = loaderData.data;

  return (
    <div className="flex h-screen items-center justify-center p-4">
      {share && (
        <div className="w-full max-w-prose space-y-4">
          <main className="border border-zinc-300 dark:border-zinc-700">
            <Editor editable={false} content={share.content as Content} />
          </main>
          <aside>
            <div className="flex flex-col justify-between gap-4 font-mono text-xs text-zinc-900 sm:flex-row dark:text-zinc-200">
              <div>
                <div title={share.expires_at} className="font-bold">
                  Expires{" "}
                  {formatDistanceToNow(share.expires_at, { addSuffix: true })}
                </div>
                <div title={share.created_at}>
                  Created{" "}
                  {formatDistanceToNow(share.created_at, { addSuffix: true })}
                </div>
              </div>
              <div className="text-right">
                <div>Created with ./?share</div>
                <NavLink to="/" className="underline" end>
                  Share something else
                </NavLink>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
