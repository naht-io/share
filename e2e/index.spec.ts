import { expect, test } from "@playwright/test";
import { addDays, formatISO } from "date-fns";

const EXAMPLE_TEXT = "Share something with Playwright";

test("can submit a share", async ({ page }) => {
  await page.goto("/");

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially("Share something with Playwright");

  await page.getByRole("button", { name: "Expiry" }).click();
  await page.getByRole("option", { name: "Expire in 3 days" }).click();

  await page.getByRole("button", { name: "Share" }).click();

  await expect(page).toHaveURL(/\/s\/.+/);

  // The submitted content is rendered in the read-only editor.
  await expect(page.locator(".ProseMirror")).toContainText(EXAMPLE_TEXT);

  const today = formatISO(new Date(), { representation: "date" });
  const inThreeDays = formatISO(addDays(new Date(), 3), { representation: "date" });

  const expires = page.locator("div[title]").filter({ hasText: "Expires" });
  await expect(expires).toContainText("Expires in 3 days");
  await expect(expires).toHaveAttribute("title", new RegExp(inThreeDays));

  const created = page.locator("div[title]").filter({ hasText: "Created" });
  await expect(created).toContainText(/Created .*/);
  await expect(created).toHaveAttribute("title", new RegExp(today));
});
