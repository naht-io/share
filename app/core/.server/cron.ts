declare global {
  var __cronJobs: Set<string> | undefined;
}

/**
 * Returns the duration for a given interval in milliseconds.
 */
export enum Interval {
  SECOND = 1000,
  MINUTE = 60 * 1000,
  HOUR = 60 * 60 * 1000,
  DAY = 24 * 60 * 60 * 1000,
}

/**
 * Registers a recurring job that runs immediately and then on every interval.
 *
 * Registration is keyed by `name` and survives module re-evaluation (e.g. HMR in
 * dev), so a given job is only ever scheduled once per process.
 *
 * @example
 * createCronJob("my-job", () => { doSomething() }, Interval.DAY);
 */
export function createCronJob(name: string, task: () => unknown, intervalMs: number): void {
  const jobs = (globalThis.__cronJobs ??= new Set());
  if (jobs.has(name)) return;
  jobs.add(name);

  setInterval(() => void task(), intervalMs).unref?.();
  void task();
}
