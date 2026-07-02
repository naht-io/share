import { redirect } from "react-router";
import * as v from "valibot";

import { expiryToDate, ShareExpiry } from "~/core/expiry";
import { generateId } from "~/core/ids";
import type { Json } from "~/core/json";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";

import type { Route } from "./+types/share";

const MAX_BODY_BYTES = 256 * 1024;

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
  expiry: v.pipe(
    v.enum(ShareExpiry, "invalid expiry date"),
    v.check((expiry) => expiry !== ShareExpiry.NEVER, "invalid expiry date"),
  ),
});

export async function action({ request }: Route.ActionArgs) {
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > MAX_BODY_BYTES) {
    throw new Response("Payload too large", { status: 413 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    throw new Response("Payload too large", { status: 413 });
  }

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }

  const result = v.safeParse(ShareSchema, data);
  if (!result.success) {
    throw new Response(result.issues[0].message, { status: 400 });
  }
  const shareData = result.output;

  const [createdShare] = await db
    .insert(shareTable)
    .values({
      id: generateId(),
      content: shareData.content,
      expiresAt: expiryToDate(shareData.expiry),
    })
    .returning({ id: shareTable.id });

  return redirect(`/s/${createdShare.id}`);
}
