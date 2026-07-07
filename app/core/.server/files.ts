import { createFsFileStorage } from "@remix-run/file-storage/fs";

export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024;
export const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 200 * 1024 * 1024;
export const MAX_FILES = 100;

export const fileStorage = createFsFileStorage(process.env.FILES_DIR ?? "./files");

/**
 * Returns the key prefix for a given share ID.
 */
export function shareKey(shareId: string): string {
  return `${shareId}/`;
}

/**
 * Returns the key for a given share ID and file ID.
 */
export function fileKey(shareId: string, fileId: string): string {
  return `${shareId}/${fileId}`;
}

/**
 * Removes all files with the given prefix from the storage.
 *
 * @example
 * // Remove all files for share ID "shareId"
 * await removeFiles(fileStorage, shareKey("shareId"));
 */
export async function removeFiles(storage: typeof fileStorage, prefix: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const result = await storage.list({ prefix, cursor });
    await Promise.all(
      result.files.map(async ({ key }) => {
        await storage.remove(key);
      }),
    );
    cursor = result.cursor;
  } while (cursor);
}
