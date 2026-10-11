/**
 * Generates an RFC 9562 compliant UUIDv7 string.
 * Format: 32-bit timestamp high + 16-bit timestamp mid/low + 4-bit ver (7) + 12-bit rand + 2-bit var (10) + 62-bit rand
 */
export declare function uuidv7(): string;
export declare const generateUuidV7: typeof uuidv7;
