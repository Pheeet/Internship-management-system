import { createHash } from "crypto";

/** Hash a plain-text password with SHA-256 */
export function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

/** Verify a plain-text password against a stored hash */
export function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}
