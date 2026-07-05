import { createFsFileStorage } from "@remix-run/file-storage/fs";

export const fileStorage = createFsFileStorage(process.env.FILES_DIR ?? "./files");
