import { expect, test } from "@playwright/test";
import { addDays } from "date-fns";

const EXAMPLE_TEXT = "Share something with Playwright";

// Tolerance when comparing server-generated timestamps against the test's own
// clock; generous enough to absorb slow CI, and keeps the assertions stable
// across midnight (unlike matching on a formatted date string).
const CLOCK_TOLERANCE_MS = 5 * 60 * 1000;

test("can submit a share", async ({ page }) => {
  const now = new Date();
  await page.goto("/");

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially(EXAMPLE_TEXT);

  await page.getByRole("button", { name: "Expiry" }).click();
  await page.getByRole("option", { name: "Expire in 3 days" }).click();

  await page.getByRole("button", { name: "Share" }).click();

  await expect(page).toHaveURL(/\/s\/.+/);

  // The submitted content is rendered in the read-only editor.
  await expect(page.locator(".ProseMirror")).toContainText(EXAMPLE_TEXT);

  const expires = page.locator("div[title]").filter({ hasText: "Expires" });
  await expect(expires).toContainText("Expires in 3 days");
  const expiresAt = new Date((await expires.getAttribute("title"))!);
  expect(Math.abs(expiresAt.getTime() - addDays(now, 3).getTime())).toBeLessThanOrEqual(
    CLOCK_TOLERANCE_MS,
  );

  const created = page.locator("div[title]").filter({ hasText: "Created" });
  await expect(created).toContainText(/Created .*/);
  const createdAt = new Date((await created.getAttribute("title"))!);
  expect(Math.abs(createdAt.getTime() - now.getTime())).toBeLessThanOrEqual(CLOCK_TOLERANCE_MS);
});
