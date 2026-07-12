import { expect, test } from "@playwright/test";

test("can submit a share as a form and see the results", async ({ page }) => {
  await page.goto("/");

  // Write some surrounding content.
  const editor = page.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially("Please introduce yourself");

  // Insert an input node and configure it via its edit dialog.
  await page.getByRole("button", { name: "Add field" }).click();
  await page.getByRole("menuitem", { name: "Input" }).click();
  await page.getByRole("button", { name: "Edit unnamed field" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Name" }).fill("Your name");
  await dialog.getByRole("textbox", { name: "Placeholder" }).fill("e.g. Mara");
  await dialog.getByText("Required").click();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Your name")).toBeVisible();

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page).toHaveURL(/\/s\/.+/);

  // The viewer sees the input and Submit stays disabled until something is
  // filled in.
  const input = page.getByRole("textbox", { name: "Your name" });
  await expect(input).toBeVisible();
  const submit = page.getByRole("button", { name: "Submit" });
  await expect(submit).toBeDisabled();

  await input.fill("mara");
  await expect(submit).toBeEnabled();
  await submit.click();

  // Submission lands on the results view, listing the submitted value.
  await expect(page).toHaveURL(/\?results$/);
  await expect(page.getByText("1 response", { exact: true })).toBeVisible();
  await expect(page.getByText("mara", { exact: true })).toBeVisible();

  // The results view links back to the fillable form.
  await page.getByRole("link", { name: "View form" }).click();
  await expect(page).toHaveURL(/\/s\/[^?]+$/);
  await expect(page.getByRole("textbox", { name: "Your name" })).toBeVisible();
});
