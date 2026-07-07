import {
  FormDataParseError,
  MaxFilesExceededError,
  MaxFileSizeExceededError,
  MaxTotalSizeExceededError,
  parseFormData,
} from "@remix-run/form-data-parser";
import { redirect } from "react-router";
import * as v from "valibot";

import { expiryToDate, ShareExpiry } from "~/core/expiry";
import { getFileNodes } from "~/core/files";
import { generateId } from "~/core/ids";
import type { Json } from "~/core/json";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";

import type { Route } from "./+types/page";
import {
  fileKey,
  fileStorage,
  MAX_FILE_SIZE,
  MAX_FILES,
  MAX_UPLOAD_SIZE,
  removeFiles,
  shareKey,
} from "~/core/.server/files";

const MAX_CONTENT_BYTES = 256 * 1024;

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
  const shareId = generateId();
  const storedIds = new Set<string>();

  async function cleanup() {
    try {
      await removeFiles(fileStorage, shareKey(shareId));
    } catch {
      // Best effort — orphaned files are only a disk-space concern.
    }
  }

  let formData: FormData;
  try {
    formData = await parseFormData(
      request,
      {
        maxFileSize: MAX_FILE_SIZE,
        maxTotalSize: MAX_UPLOAD_SIZE + MAX_CONTENT_BYTES + 1024 * 1024,
        maxFiles: MAX_FILES,
      },
      async (fileUpload) => {
        const match = /^file:([0-9BCDFGHJ-NP-TV-Zbcdfghj-np-tv-z]{12})$/.exec(fileUpload.fieldName);
        if (!match) return null;
        const id = match[1];
        await fileStorage.set(fileKey(shareId, id), fileUpload);
        storedIds.add(id);
        return null;
      },
    );
  } catch (error) {
    await cleanup();
    if (
      error instanceof MaxFileSizeExceededError ||
      error instanceof MaxTotalSizeExceededError ||
      error instanceof MaxFilesExceededError
    ) {
      throw new Response("Payload too large", { status: 413 });
    }
    if (error instanceof FormDataParseError) {
      throw new Response("Invalid form data", { status: 400 });
    }
    throw error;
  }

  try {
    const contentRaw = formData.get("content");
    if (typeof contentRaw !== "string") {
      throw new Response("Missing content", { status: 400 });
    }
    if (Buffer.byteLength(contentRaw) > MAX_CONTENT_BYTES) {
      throw new Response("Payload too large", { status: 413 });
    }

    let content: unknown;
    try {
      content = JSON.parse(contentRaw);
    } catch {
      throw new Response("Invalid JSON", { status: 400 });
    }

    const result = v.safeParse(ShareSchema, { content, expiry: formData.get("expiry") });
    if (!result.success) {
      throw new Response(result.issues[0].message, { status: 400 });
    }
    const shareData = result.output;

    // Every file chip in the document must have an uploaded part; parts not
    // referenced by any chip (deleted client-side before submit, or a
    // hand-crafted request) are discarded.
    const nodeIds = new Set(getFileNodes(shareData.content).map((node) => node.id));
    for (const id of nodeIds) {
      if (!storedIds.has(id)) {
        throw new Response("Missing file upload", { status: 400 });
      }
    }
    for (const id of storedIds) {
      if (!nodeIds.has(id)) {
        await fileStorage.remove(fileKey(shareId, id));
      }
    }

    await db.insert(shareTable).values({
      id: shareId,
      content: shareData.content,
      expiresAt: expiryToDate(shareData.expiry),
    });

    return redirect(`/s/${shareId}`);
  } catch (error) {
    await cleanup();
    throw error;
  }
}
