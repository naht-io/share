import { purgeExpired } from "~/boot/purge.server";

declare global {
  var __purgeCronStarted: boolean | undefined;
}

// Purge expired shares every day
if (!globalThis.__purgeCronStarted) {
  globalThis.__purgeCronStarted = true;
  setInterval(purgeExpired, 24 * 60 * 60 * 1000).unref?.();
  void purgeExpired();
}
