import { customAlphabet as nanoid } from "nanoid";

const alphabet = "0123456789BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz";
const length = 12;
const genId = nanoid(alphabet, length);
const idPattern = new RegExp(`^[${alphabet}]{${length}}$`);

/**
 * Returns a generated ID.
 */
export function generateId(): string {
  return genId();
}

/**
 * Returns whether the value is a well-formed generated ID.
 */
export function isValidId(value: string): boolean {
  return idPattern.test(value);
}
