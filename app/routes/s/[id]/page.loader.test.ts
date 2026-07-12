import { afterEach, describe, expect, setSystemTime, test } from "bun:test";

import { generateId } from "~/core/id";
import type { Json } from "~/core/json";
import { db } from "~/db/index.server";
import { shareTable, submissionTable } from "~/db/schema.server";
import { catchResponse } from "~/test/utils";

import { loader } from "./page";

describe("s/[id]", () => {
  describe("loader", () => {
    // A fixed whole-second instant: SQLite timestamps have second resolution,
    // so this round-trips through the database without losing precision.
    const now = new Date("2026-07-03T12:00:00Z");
    const content = { type: "doc", content: [{ type: "paragraph" }] };

    afterEach(() => {
      setSystemTime();
    });

    test("should return data on success", async () => {
      setSystemTime(now);
      const id = generateId();
      const createdAt = now;
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await db.insert(shareTable).values({ id, content, createdAt, expiresAt });
      const result = await loader(getLoaderParams(id));

      expect(result.data.content).toEqual(content);
      expect(result.data.createdAt).toBe(createdAt.toISOString());
      expect(result.data.expiresAt).toBe(expiresAt.toISOString());
      expect(result.data.url).toBe(`https://share.example/s/${id}`);
    });

    test("should 404 on nonexistent id", async () => {
      const response = await catchResponse(loader(getLoaderParams("does-not-exist")));
      expect(response.status).toBe(404);
    });

    test("should 404 on expired share", async () => {
      setSystemTime(now);
      const id = generateId();
      const expiresAt = new Date(now.getTime() - 1000);

      await db.insert(shareTable).values({ id, content, expiresAt });
      const response = await catchResponse(loader(getLoaderParams(id)));

      expect(response.status).toBe(404);
    });

    test("should 400 on missing id", async () => {
      const response = await catchResponse(loader({ params: {} } as unknown as LoaderArgs));
      expect(response.status).toBe(400);
    });

    describe("form modes", () => {
      const nodeId = generateId();
      const contentWithInput: Json = {
        type: "doc",
        content: [
          {
            type: "input",
            attrs: { id: nodeId, name: "Name", placeholder: "", required: false },
          },
        ],
      };

      async function createShare(shareContent: Json): Promise<string> {
        const id = generateId();
        await db.insert(shareTable).values({
          id,
          content: shareContent,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        return id;
      }

      test("should return the form arm without form nodes", async () => {
        const id = await createShare(content);
        const result = await loader(getLoaderParams(id));
        expect(result.form).toEqual({ mode: "form", hasFormNodes: false });
      });

      test("should return the form arm with form nodes", async () => {
        const id = await createShare(contentWithInput);
        const result = await loader(getLoaderParams(id));
        expect(result.form).toEqual({ mode: "form", hasFormNodes: true });
      });

      test("should ignore ?results on a share without form nodes", async () => {
        const id = await createShare(content);
        const result = await loader(getLoaderParams(id, "?results"));
        expect(result.form).toEqual({ mode: "form", hasFormNodes: false });
      });

      test("should return non-empty values newest first on ?results", async () => {
        const id = await createShare(contentWithInput);
        const base = Date.now();
        await db.insert(submissionTable).values([
          { shareId: id, data: { [nodeId]: "older" }, createdAt: new Date(base - 2000) },
          { shareId: id, data: { [nodeId]: "  " }, createdAt: new Date(base - 1000) },
          { shareId: id, data: { [nodeId]: "newer" }, createdAt: new Date(base) },
        ]);

        const result = await loader(getLoaderParams(id, "?results"));

        expect(result.form).toEqual({
          mode: "results",
          results: { [nodeId]: ["newer", "older"] },
        });
      });

      test("should exclude the results param from the canonical url", async () => {
        const id = await createShare(contentWithInput);
        const result = await loader(getLoaderParams(id, "?results"));
        expect(result.data.url).toBe(`https://share.example/s/${id}`);
      });
    });
  });
});

function getLoaderParams(id: string, search = ""): LoaderArgs {
  return {
    params: { id },
    request: new Request("https://share.example/s/" + id + search),
  } as unknown as LoaderArgs;
}

type LoaderArgs = Parameters<typeof loader>[0];
