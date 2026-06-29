import { customAlphabet as nanoid } from "nanoid";

const genId = nanoid("0123456789BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz", 12);

export function generateId(): string {
  return genId();
}
