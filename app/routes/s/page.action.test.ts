import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { eq } from "drizzle-orm";

import { ShareExpiry } from "~/core/expiry";
import { fileKey, fileStorage, MAX_FILE_SIZE, MAX_UPLOAD_SIZE } from "~/core/.server/files";
import { generateId } from "~/core/ids";
import type { Json } from "~/core/json";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";
import { catchResponse } from "~/test/utils";

import { action } from "./page";

describe("s/", () => {
  describe("action", () => {
    const validContent = { type: "doc", content: [{ type: "paragraph" }] };
    // A fixed whole-second instant: SQLite timestamps have second resolution,
    // so this round-trips through the database without losing precision.
    const now = new Date("2026-07-03T12:00:00Z");

    afterEach(() => {
      setSystemTime();
    });

    test("should return redirect on success", async () => {
      const response = await action(
        getActionParams({ content: validContent, expiry: ShareExpiry.TOMORROW }),
      );

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toMatch(/^\/s\/.+/);
    });

    test("should persist share on success", async () => {
      setSystemTime(now);
      const response = await action(
        getActionParams({ content: validContent, expiry: ShareExpiry.TOMORROW }),
      );

      const id = response.headers.get("location")!.replace("/s/", "");
      const [row] = await db.select().from(shareTable).where(eq(shareTable.id, id));
      expect(row.content).toEqual(validContent);
      expect(row.expiresAt).toEqual(new Date("2026-07-04T12:00:00Z"));
    });

    test("should 400 on invalid json content", async () => {
      const formData = new FormData();
      formData.set("content", "not json{");
      formData.set("expiry", ShareExpiry.TOMORROW);
      const response = await catchResponse(action(getFormDataParams(formData)));
      expect(response.status).toBe(400);
    });

    test("should 400 on missing content", async () => {
      const formData = new FormData();
      formData.set("expiry", ShareExpiry.TOMORROW);
      const response = await catchResponse(action(getFormDataParams(formData)));
      expect(response.status).toBe(400);
    });

    test("should 400 on invalid content", async () => {
      const response = await catchResponse(
        action(getActionParams({ content: { type: "not-a-doc" }, expiry: ShareExpiry.TOMORROW })),
      );
      expect(response.status).toBe(400);
    });

    test("should 400 on missing expiry", async () => {
      const formData = new FormData();
      formData.set("content", JSON.stringify(validContent));
      const response = await catchResponse(action(getFormDataParams(formData)));
      expect(response.status).toBe(400);
    });

    test("should 400 on invalid expiry", async () => {
      const response = await catchResponse(
        action(getActionParams({ content: validContent, expiry: ShareExpiry.NEVER })),
      );
      expect(response.status).toBe(400);
    });

    test("should 400 on a non-multipart body", async () => {
      const request = new Request("http://localhost/s", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: validContent, expiry: ShareExpiry.TOMORROW }),
      });
      const response = await catchResponse(action({ request } as unknown as ActionArgs));
      expect(response.status).toBe(400);
    });

    test("should 413 (payload too large) if the content part is too big", async () => {
      const formData = new FormData();
      formData.set("content", "x".repeat(256 * 1024 + 1));
      formData.set("expiry", ShareExpiry.TOMORROW);
      const response = await catchResponse(action(getFormDataParams(formData)));
      expect(response.status).toBe(413);
    });

    describe("with files", () => {
      test("should store uploaded files referenced by chips", async () => {
        const fileId = generateId();
        const response = await action(
          getActionParams(
            { content: docWithChips([fileId]), expiry: ShareExpiry.TOMORROW },
            { [fileId]: new File(["hello world"], "hello.txt", { type: "text/plain" }) },
          ),
        );

        expect(response.status).toBe(302);
        const shareId = response.headers.get("location")!.replace("/s/", "");
        const file = await fileStorage.get(fileKey(shareId, fileId));
        expect(file).not.toBeNull();
        expect(file!.name).toBe("hello.txt");
        expect(file!.type).toStartWith("text/plain");
        expect(await file!.text()).toBe("hello world");
      });

      test("should 400 and store nothing if a chip has no matching upload", async () => {
        const uploaded = generateId();
        const missing = generateId();
        const response = await catchResponse(
          action(
            getActionParams(
              { content: docWithChips([uploaded, missing]), expiry: ShareExpiry.TOMORROW },
              { [uploaded]: new File(["data"], "a.txt", { type: "text/plain" }) },
            ),
          ),
        );

        expect(response.status).toBe(400);
        expect(await storedFileCount()).toBe(0);
      });

      test("should discard uploads not referenced by any chip", async () => {
        const orphan = generateId();
        const response = await action(
          getActionParams(
            { content: validContent, expiry: ShareExpiry.TOMORROW },
            { [orphan]: new File(["data"], "orphan.txt", { type: "text/plain" }) },
          ),
        );

        expect(response.status).toBe(302);
        expect(await storedFileCount()).toBe(0);
      });

      test("should ignore file parts with malformed field names", async () => {
        const formData = new FormData();
        formData.set("content", JSON.stringify(validContent));
        formData.set("expiry", ShareExpiry.TOMORROW);
        formData.append("file:../evil", new File(["data"], "evil.txt", { type: "text/plain" }));

        const response = await action(getFormDataParams(formData));

        expect(response.status).toBe(302);
        expect(await storedFileCount()).toBe(0);
      });

      test("should 413 and store nothing if a file exceeds the per-file limit", async () => {
        const fileId = generateId();
        const tooBig = new File(["x".repeat(MAX_FILE_SIZE + 1)], "big.bin");
        const response = await catchResponse(
          action(
            getActionParams(
              { content: docWithChips([fileId]), expiry: ShareExpiry.TOMORROW },
              { [fileId]: tooBig },
            ),
          ),
        );

        expect(response.status).toBe(413);
        expect(await storedFileCount()).toBe(0);
      });

      test("should 413 and store nothing if the files exceed the total limit", async () => {
        const size = Math.ceil(MAX_FILE_SIZE * 0.9);
        const count = Math.ceil((MAX_UPLOAD_SIZE + 2 * 1024 * 1024) / size);
        const files: Record<string, File> = {};
        for (let i = 0; i < count; i++) {
          files[generateId()] = new File(["x".repeat(size)], `file-${i}.bin`);
        }
        const response = await catchResponse(
          action(
            getActionParams(
              { content: docWithChips(Object.keys(files)), expiry: ShareExpiry.TOMORROW },
              files,
            ),
          ),
        );

        expect(response.status).toBe(413);
        expect(await storedFileCount()).toBe(0);
      });
    });
  });
});

function docWithChips(fileIds: string[]): Json {
  return {
    type: "doc",
    content: fileIds.map((id) => ({
      type: "file",
      attrs: { id, name: `${id}.txt`, size: 1, type: "text/plain" },
    })),
  };
}

function getActionParams(
  data: { content: Json; expiry: string },
  files: Record<string, File> = {},
): ActionArgs {
  const formData = new FormData();
  formData.set("content", JSON.stringify(data.content));
  formData.set("expiry", data.expiry);
  for (const [id, file] of Object.entries(files)) {
    formData.append(`file:${id}`, file, file.name);
  }
  return getFormDataParams(formData);
}

function getFormDataParams(formData: FormData): ActionArgs {
  // fetch derives the multipart content-type (with boundary) from the body.
  const request = new Request("http://localhost/s", { method: "POST", body: formData });
  return { request } as unknown as ActionArgs;
}

async function storedFileCount(): Promise<number> {
  const { files } = await fileStorage.list();
  return files.length;
}

type ActionArgs = Parameters<typeof action>[0];
