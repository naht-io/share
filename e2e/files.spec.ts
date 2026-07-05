import { expect, test } from "@playwright/test";

const FILE_NAME = "hello.txt";
const FILE_CONTENT = "hello from playwright";

test("can attach a file and download it from the share", async ({ page }) => {
  await page.goto("/");

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially("A share with a file");

  // setInputFiles works on the hidden input backing the "Add files" button.
  await page.locator('input[type="file"]').setInputFiles({
    name: FILE_NAME,
    mimeType: "text/plain",
    buffer: Buffer.from(FILE_CONTENT),
  });

  // The chip shows up in the editor with a remove button.
  const chip = editor.locator("[data-file-chip]").filter({ hasText: FILE_NAME });
  await expect(chip).toBeVisible();
  await expect(chip.getByRole("button", { name: `Remove ${FILE_NAME}` })).toBeVisible();

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page).toHaveURL(/\/s\/.+/);

  // On the shared page the chip is a download link without a remove button.
  const sharedChip = page.locator(".ProseMirror [data-file-chip]").filter({ hasText: FILE_NAME });
  await expect(sharedChip.locator("a")).toBeVisible();
  await expect(sharedChip.getByRole("button")).toHaveCount(0);

  const downloadPromise = page.waitForEvent("download");
  await sharedChip.locator("a").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(FILE_NAME);

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  expect(Buffer.concat(chunks).toString()).toBe(FILE_CONTENT);
});

test("can remove an attached file before sharing", async ({ page }) => {
  await page.goto("/");

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await editor.pressSequentially("A share without its file");

  await page.locator('input[type="file"]').setInputFiles({
    name: FILE_NAME,
    mimeType: "text/plain",
    buffer: Buffer.from(FILE_CONTENT),
  });

  const chip = editor.locator("[data-file-chip]").filter({ hasText: FILE_NAME });
  await expect(chip).toBeVisible();
  await chip.getByRole("button", { name: `Remove ${FILE_NAME}` }).click();
  await expect(chip).toHaveCount(0);

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page).toHaveURL(/\/s\/.+/);
  await expect(page.locator(".ProseMirror")).toContainText("A share without its file");
  await expect(page.locator(".ProseMirror [data-file-chip]")).toHaveCount(0);
});
