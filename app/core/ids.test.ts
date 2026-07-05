import { describe, expect, test } from "bun:test";
import { generateId } from "./ids";

describe("generateId", () => {
  test("should generate 12-character ids from the url-safe alphabet", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateId()).toMatch(/^[0-9BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz]{12}$/);
    }
  });

  test("should not generate duplicate ids", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });
});
