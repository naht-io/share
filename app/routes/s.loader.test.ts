import { afterEach, describe, expect, setSystemTime, test } from "bun:test";

import { generateId } from "~/core/ids";
import { db } from "~/db/index.server";
import { shareTable } from "~/db/schema.server";
import { loader } from "~/routes/s";
import { catchResponse } from "~/test/utils";

describe("s/ loader", () => {
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
});

function getLoaderParams(id: string): LoaderArgs {
  return {
    params: { id },
    request: new Request("https://share.example/s/" + id),
  } as unknown as LoaderArgs;
}

type LoaderArgs = Parameters<typeof loader>[0];
