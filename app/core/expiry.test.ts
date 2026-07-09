import { afterEach, describe, expect, setSystemTime, test } from "bun:test";

import { expiryToDate, ShareExpiry } from "./expiry";

describe("expiryToDate", () => {
  // Noon UTC keeps the calendar arithmetic clear of DST boundaries.
  const now = new Date("2026-07-03T12:00:00Z");

  afterEach(() => {
    setSystemTime();
  });

  test.each([
    [ShareExpiry.TOMORROW, new Date("2026-07-04T12:00:00Z")],
    [ShareExpiry.THREE_DAYS, new Date("2026-07-06T12:00:00Z")],
    [ShareExpiry.ONE_WEEK, new Date("2026-07-10T12:00:00Z")],
    [ShareExpiry.ONE_MONTH, new Date("2026-08-03T12:00:00Z")],
  ])("should offset from now for %s", (expiry, expected) => {
    setSystemTime(now);
    expect(expiryToDate(expiry)).toEqual(expected);
  });

  test("should return the far-future sentinel for never", () => {
    expect(expiryToDate(ShareExpiry.NEVER)).toEqual(new Date("9999-11-11T00:00:00Z"));
  });
});
