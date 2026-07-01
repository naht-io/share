import { redirect } from "react-router";
import * as v from "valibot";

import { expiryToDate, ShareExpiry } from "~/core/expiry";
import { generateId } from "~/core/ids";
import type { Json } from "~/core/json";
import { getDb } from "~/db";
import { shareTable } from "~/db/schema";

import type { Route } from "./+types/share";

const ShareSchema = v.object({
  content: v.pipe(
    v.object(
      {
        type: v.literal("doc"),
        content: v.array(v.any()),
      },
      "content must be a prosemirror/tiptap-compatible document",
    ),
    v.transform((input) => input as Json),
  ),
  expiry: v.enum(ShareExpiry, "invalid expiry date"),
});

export async function action({ request }: Route.ActionArgs) {
  const data = await request.json();
  const shareData = v.parse(ShareSchema, data);

  const [createdShare] = await getDb()
    .insert(shareTable)
    .values({
      id: generateId(),
      content: shareData.content,
      expiresAt: expiryToDate(shareData.expiry),
    })
    .returning({ id: shareTable.id });

  return redirect(`/s/${createdShare.id}`);
}
