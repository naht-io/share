import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { createCronJob, Interval } from "./cron";

describe("createCronJob", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.__cronJobs = undefined;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("should run the task immediately", () => {
    let calls = 0;
    createCronJob("test", () => calls++, Interval.SECOND);
    expect(calls).toBe(1);
  });

  test("should run the task on every interval", () => {
    let calls = 0;
    createCronJob("test", () => calls++, Interval.SECOND);
    jest.advanceTimersByTime(3000);
    expect(calls).toBe(4); // one immediate run plus three intervals
  });

  test("should register a job with the same name only once", () => {
    let calls = 0;
    createCronJob("test", () => calls++, Interval.SECOND);
    createCronJob("test", () => calls++, Interval.SECOND);
    jest.advanceTimersByTime(2000);
    expect(calls).toBe(3); // one immediate run plus two intervals, from a single registration
  });

  test("should register jobs with different names independently", () => {
    let calls = 0;
    createCronJob("a", () => calls++, Interval.SECOND);
    createCronJob("b", () => calls++, Interval.SECOND);
    expect(calls).toBe(2);
  });
});
