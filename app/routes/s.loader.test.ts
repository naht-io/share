import { describe, expect, test } from "bun:test";

import { generateId } from "~/core/ids";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";
import { loader } from "~/routes/s";
import { catchResponse } from "~/test/utils";

describe("s/ loader", () => {
  test("should return data on success", async () => {
    const id = generateId();
    const nowSeconds = Math.floor(Date.now() / 1000) * 1000;
    const createdAt = new Date(nowSeconds);
    const expiresAt = new Date(nowSeconds + 24 * 60 * 60 * 1000);
    const content = { type: "doc", content: [{ type: "paragraph" }] };

    await db.insert(shareTable).values({ id, content, createdAt, expiresAt });
    const result = await loader(getLoaderParams(id));

    expect(result.data.content).toEqual(content);
    expect(result.data.createdAt).toBe(createdAt.toISOString());
    expect(result.data.expiresAt).toBe(expiresAt.toISOString());
  });

  test("should 404 on invalid url", async () => {
    const response = await catchResponse(
      loader(getLoaderParams("does-not-exist")),
    );
    expect(response.status).toBe(404);
  });
});

function getLoaderParams(id: string): LoaderArgs {
  return { params: { id } } as unknown as LoaderArgs;
}

type LoaderArgs = Parameters<typeof loader>[0];
