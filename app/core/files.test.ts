import { describe, expect, test } from "bun:test";

import { collectFileNodes, formatFileSize } from "~/core/files";

describe("collectFileNodes", () => {
  test("should collect chips nested anywhere in the document", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "hello" },
            { type: "fileChip", attrs: { id: "a1", name: "a.txt", size: 3, type: "text/plain" } },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "fileChip",
                  attrs: { id: "b2", name: "b.png", size: 9, type: "image/png" },
                },
              ],
            },
          ],
        },
      ],
    };

    expect(collectFileNodes(doc)).toEqual([
      { id: "a1", name: "a.txt", size: 3, type: "text/plain" },
      { id: "b2", name: "b.png", size: 9, type: "image/png" },
    ]);
  });

  test("should dedupe chips sharing an id", () => {
    const chip = { type: "fileChip", attrs: { id: "a1", name: "a.txt", size: 3, type: "" } };
    const doc = { type: "doc", content: [{ type: "paragraph", content: [chip, chip] }] };

    expect(collectFileNodes(doc)).toHaveLength(1);
  });

  test("should ignore chips without a string id", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "fileChip", attrs: { id: 42 } }] }],
    };

    expect(collectFileNodes(doc)).toEqual([]);
  });

  test("should return an empty list for documents without chips", () => {
    expect(collectFileNodes({ type: "doc", content: [] })).toEqual([]);
  });
});

describe("formatFileSize", () => {
  test.each([
    [0, "0 B"],
    [512, "512 B"],
    [1024, "1.0 KB"],
    [1536, "1.5 KB"],
    [10 * 1024, "10 KB"],
    [5 * 1024 * 1024, "5.0 MB"],
    [50 * 1024 * 1024, "50 MB"],
    [2 * 1024 * 1024 * 1024, "2.0 GB"],
  ])("should format %i bytes as %s", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});
