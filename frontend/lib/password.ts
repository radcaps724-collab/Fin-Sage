import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedValue: string): boolean => {
  const [salt, hash] = storedValue.split(":");
  if (!salt || !hash) {
    return false;
  }
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const original = Buffer.from(hash, "hex");
  if (candidate.length !== original.length) {
    return false;
  }
  return timingSafeEqual(candidate, original);
};
