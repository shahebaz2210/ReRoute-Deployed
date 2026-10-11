import { randomBytes } from "node:crypto";

/**
 * Generates an RFC 9562 compliant UUIDv7 string.
 * Format: 32-bit timestamp high + 16-bit timestamp mid/low + 4-bit ver (7) + 12-bit rand + 2-bit var (10) + 62-bit rand
 */
export function uuidv7(): string {
  const now = Date.now();
  const bytes = randomBytes(16);

  // 48-bit timestamp (milliseconds since epoch)
  bytes[0] = (now / 0x10000000000) & 0xff;
  bytes[1] = (now / 0x100000000) & 0xff;
  bytes[2] = (now / 0x1000000) & 0xff;
  bytes[3] = (now / 0x10000) & 0xff;
  bytes[4] = (now / 0x100) & 0xff;
  bytes[5] = now & 0xff;

  // Version 7: 0b0111_xxxx
  bytes[6] = 0x70 | (bytes[6] & 0x0f);

  // Variant: 0b10xx_xxxx
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export const generateUuidV7 = uuidv7;

