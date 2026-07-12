import { describe, expect, test } from "bun:test";

import { eq } from "drizzle-orm";

import { maxSubmissions } from "~/core/.server/forms";
import { maxValueLength } from "~/core/forms";
import { generateId } from "~/core/id";
import type { Json } from "~/core/json";
import { db } from "~/db/index.server";
import { shareTable, submissionTable } from "~/db/schema.server";
import { catchResponse } from "~/test/utils";

import { action } from "./page";

describe("s/[id]", () => {
  describe("action", () => {
    const nameId = generateId();
    const emailId = generateId();

    test("should persist a submission and redirect to results", async () => {
      const id = await createShare(
        docWithInputs([
          { id: nameId, name: "Name" },
          { id: emailId, name: "Email" },
        ]),
      );

      const response = await action(getActionParams(id, { [nameId]: "mara", [emailId]: "" }));

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(`/s/${id}?results`);
      const rows = await db.select().from(submissionTable).where(eq(submissionTable.shareId, id));
      expect(rows).toHaveLength(1);
      expect(rows[0].data).toEqual({ [nameId]: "mara", [emailId]: "" });
    });

    test("should store a missing optional field as an empty string", async () => {
      const id = await createShare(
        docWithInputs([
          { id: nameId, name: "Name" },
          { id: emailId, name: "Email" },
        ]),
      );

      await action(getActionParams(id, { [nameId]: "mara" }));

      const [row] = await db.select().from(submissionTable).where(eq(submissionTable.shareId, id));
      expect(row.data).toEqual({ [nameId]: "mara", [emailId]: "" });
    });

    test("should 404 on nonexistent share", async () => {
      const response = await catchResponse(
        action(getActionParams("does-not-exist", { [nameId]: "mara" })),
      );
      expect(response.status).toBe(404);
    });

    test("should 404 on expired share", async () => {
      const id = await createShare(docWithInputs([{ id: nameId, name: "Name" }]), {
        expiresAt: new Date(Date.now() - 1000),
      });

      const response = await catchResponse(action(getActionParams(id, { [nameId]: "mara" })));
      expect(response.status).toBe(404);
    });

    test("should 400 on a share without form nodes", async () => {
      const id = await createShare({ type: "doc", content: [{ type: "paragraph" }] });

      const response = await catchResponse(action(getActionParams(id, { [nameId]: "mara" })));
      expect(response.status).toBe(400);
    });

    test("should 400 on an unknown field", async () => {
      const id = await createShare(docWithInputs([{ id: nameId, name: "Name" }]));

      const response = await catchResponse(
        action(getActionParams(id, { [nameId]: "mara", intent: "evil" })),
      );
      expect(response.status).toBe(400);
    });

    test("should 400 on a blank required field", async () => {
      const id = await createShare(
        docWithInputs([
          { id: nameId, name: "Name", required: true },
          { id: emailId, name: "Email" },
        ]),
      );

      const response = await catchResponse(
        action(getActionParams(id, { [nameId]: "  ", [emailId]: "filled" })),
      );
      expect(response.status).toBe(400);
    });

    test("should 400 on an all-empty submission", async () => {
      const id = await createShare(
        docWithInputs([
          { id: nameId, name: "Name" },
          { id: emailId, name: "Email" },
        ]),
      );

      const response = await catchResponse(
        action(getActionParams(id, { [nameId]: " ", [emailId]: "" })),
      );
      expect(response.status).toBe(400);
    });

    test("should 400 on an oversize value", async () => {
      const id = await createShare(docWithInputs([{ id: nameId, name: "Name" }]));

      const response = await catchResponse(
        action(getActionParams(id, { [nameId]: "x".repeat(maxValueLength + 1) })),
      );
      expect(response.status).toBe(400);
    });

    test("should 429 once the submission cap is reached", async () => {
      const id = await createShare(docWithInputs([{ id: nameId, name: "Name" }]));
      for (let i = 0; i < maxSubmissions; i++) {
        await db.insert(submissionTable).values({ shareId: id, data: { [nameId]: `v${i}` } });
      }

      const response = await catchResponse(action(getActionParams(id, { [nameId]: "mara" })));
      expect(response.status).toBe(429);
    });
  });
});

function docWithInputs(nodes: { id: string; name: string; required?: boolean }[]): Json {
  return {
    type: "doc",
    content: nodes.map((node) => ({
      type: "input",
      attrs: { id: node.id, name: node.name, placeholder: "", required: node.required ?? false },
    })),
  };
}

async function createShare(content: Json, options: { expiresAt?: Date } = {}): Promise<string> {
  const id = generateId();
  await db.insert(shareTable).values({
    id,
    content,
    expiresAt: options.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return id;
}

function getActionParams(id: string, fields: Record<string, string>): ActionArgs {
  const request = new Request(`http://localhost/s/${id}`, {
    method: "POST",
    body: new URLSearchParams(fields),
  });
  return { params: { id }, request } as unknown as ActionArgs;
}

type ActionArgs = Parameters<typeof action>[0];
