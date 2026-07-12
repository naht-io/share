import { describe, expect, test } from "bun:test";

import { getFormNodes } from "./forms";

describe("getFormNodes", () => {
  test("should collect form nodes nested anywhere in the document", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "hello" }],
        },
        {
          type: "input",
          attrs: { id: "a1", name: "Name", placeholder: "e.g. Mara", required: true },
        },
        {
          type: "blockquote",
          content: [
            {
              type: "input",
              attrs: { id: "b2", name: "Email", placeholder: "", required: false },
            },
          ],
        },
      ],
    };

    expect(getFormNodes(doc)).toEqual([
      { id: "a1", type: "input", name: "Name", placeholder: "e.g. Mara", required: true },
      { id: "b2", type: "input", name: "Email", placeholder: "", required: false },
    ]);
  });

  test("should dedupe nodes sharing an id", () => {
    const node = {
      type: "input",
      attrs: { id: "a1", name: "Name", placeholder: "", required: false },
    };
    const doc = { type: "doc", content: [node, node] };

    expect(getFormNodes(doc)).toHaveLength(1);
  });

  test("should ignore nodes without a string id", () => {
    const doc = {
      type: "doc",
      content: [{ type: "input", attrs: { id: 42 } }],
    };

    expect(getFormNodes(doc)).toEqual([]);
  });

  test("should default malformed attrs to safe values", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "input", attrs: { id: "a1", name: 7, placeholder: null, required: "yes" } },
      ],
    };

    expect(getFormNodes(doc)).toEqual([
      { id: "a1", type: "input", name: "", placeholder: "", required: false },
    ]);
  });

  test("should ignore other node types", () => {
    const doc = {
      type: "doc",
      content: [{ type: "file", attrs: { id: "a1", name: "a.txt", size: 1, type: "text/plain" } }],
    };

    expect(getFormNodes(doc)).toEqual([]);
  });

  test("should return an empty list for documents without form nodes", () => {
    expect(getFormNodes({ type: "doc", content: [] })).toEqual([]);
  });
});
