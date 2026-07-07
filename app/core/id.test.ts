import { describe, expect, test } from "bun:test";
import { generateId, isValidId } from "./id";

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

describe("isValidId", () => {
  test("should accept generated ids", () => {
    for (let i = 0; i < 100; i++) {
      expect(isValidId(generateId())).toBe(true);
    }
  });

  test("should reject ids with the wrong length", () => {
    expect(isValidId("")).toBe(false);
    expect(isValidId("0123456789b")).toBe(false);
    expect(isValidId("0123456789bcd")).toBe(false);
  });

  test("should reject characters outside the alphabet", () => {
    expect(isValidId("A123456789bc")).toBe(false);
    expect(isValidId("e123456789bc")).toBe(false);
    expect(isValidId("_123456789bc")).toBe(false);
    expect(isValidId("-123456789bc")).toBe(false);
  });

  test("should not match partially", () => {
    expect(isValidId("0123456789bc\n")).toBe(false);
    expect(isValidId("x0123456789bc")).toBe(false);
  });
});
