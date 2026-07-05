import { customAlphabet as nanoid } from "nanoid";

const genId = nanoid("0123456789BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz", 12);

/**
 * Returns a generated ID.
 */
export function generateId(): string {
  return genId();
}
