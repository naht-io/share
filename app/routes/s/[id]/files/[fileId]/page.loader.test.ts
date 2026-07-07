import { describe, expect, test } from "bun:test";
import { addDays, subDays } from "date-fns";
import { fileKey, fileStorage } from "~/core/.server/files";

import { generateId } from "~/core/id";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";
import { catchResponse } from "~/test/utils";

import { loader } from "./page";

describe("s/[id]/files/[fileId]", () => {
  describe("loader", () => {
    const content = { type: "doc", content: [] };

    async function seedShare(expiresAt: Date): Promise<string> {
      const id = generateId();
      await db.insert(shareTable).values({ id, content, expiresAt });
      return id;
    }

    test("should stream the file with download headers", async () => {
      const shareId = await seedShare(addDays(new Date(), 1));
      const fileId = generateId();
      await fileStorage.set(
        fileKey(shareId, fileId),
        new File(["hello world"], "hello world.txt", { type: "text/plain" }),
      );

      const response = await loader(getLoaderParams(shareId, fileId));

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toStartWith("text/plain");
      expect(response.headers.get("content-length")).toBe("11");
      expect(response.headers.get("content-disposition")).toBe(
        "attachment; filename*=UTF-8''hello%20world.txt",
      );
      expect(await response.text()).toBe("hello world");
    });

    test("should 404 for an expired share even if the file still exists", async () => {
      const shareId = await seedShare(subDays(new Date(), 1));
      const fileId = generateId();
      await fileStorage.set(fileKey(shareId, fileId), new File(["data"], "a.txt"));

      const response = await catchResponse(loader(getLoaderParams(shareId, fileId)));
      expect(response.status).toBe(404);
    });

    test("should 404 for an unknown share", async () => {
      const response = await catchResponse(loader(getLoaderParams(generateId(), generateId())));
      expect(response.status).toBe(404);
    });

    test("should 404 for an unknown file on a live share", async () => {
      const shareId = await seedShare(addDays(new Date(), 1));
      const response = await catchResponse(loader(getLoaderParams(shareId, generateId())));
      expect(response.status).toBe(404);
    });
  });
});

function getLoaderParams(id: string, fileId: string): LoaderArgs {
  return { params: { id, fileId } } as unknown as LoaderArgs;
}

type LoaderArgs = Parameters<typeof loader>[0];
