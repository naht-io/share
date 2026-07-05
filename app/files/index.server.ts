export { fileStorage } from "~/files/storage.server";
import { fileStorage } from "~/files/storage.server";

export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024;
export const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 200 * 1024 * 1024;

export function fileKey(shareId: string, fileId: string): string {
  return `${shareId}/${fileId}`;
}

export async function removeShareFiles(shareId: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const result = await fileStorage.list({ prefix: `${shareId}/`, cursor });
    for (const { key } of result.files) {
      await fileStorage.remove(key);
    }
    cursor = result.cursor;
  } while (cursor);
}
