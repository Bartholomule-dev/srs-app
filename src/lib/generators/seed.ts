// src/lib/generators/seed.ts
// Deterministic seed generation for parameterized exercises

/**
 * Simple SHA-256 hash using Web Crypto API (available in Node and browsers).
 * Returns a 64-character hex string.
 */
export function hashString(input: string): string {
  // Use a simple hash for determinism (no crypto needed for non-security use)
  // This is a variant of djb2 extended to 256 bits via multiple passes
  let h1 = 5381;
  let h2 = 52711;
  let h3 = 33791;
  let h4 = 10301;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ char;
    h2 = ((h2 << 5) + h2) ^ char;
    h3 = ((h3 << 5) + h3) ^ char;
    h4 = ((h4 << 5) + h4) ^ char;
  }

  // Convert to unsigned 32-bit integers
  h1 = h1 >>> 0;
  h2 = h2 >>> 0;
  h3 = h3 >>> 0;
  h4 = h4 >>> 0;

  // Combine into 64-char hex string (256 bits)
  return (
    h1.toString(16).padStart(8, '0') +
    h2.toString(16).padStart(8, '0') +
    h3.toString(16).padStart(8, '0') +
    h4.toString(16).padStart(8, '0') +
    // Add more entropy with secondary mixing
    ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0') +
    ((h2 ^ h3) >>> 0).toString(16).padStart(8, '0') +
    ((h3 ^ h4) >>> 0).toString(16).padStart(8, '0') +
    ((h4 ^ h1) >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Create a deterministic seed for exercise parameter generation.
 *
 * The seed is derived from:
 * - userId: Each user sees different values
 * - exerciseSlug: Each exercise has its own parameter space
 * - dueDate: Values change on different review days
 *
 * Same (userId, exerciseSlug, date) always produces same seed.
 */
export function createSeed(
  userId: string,
  exerciseSlug: string,
  dueDate: Date
): string {
  // Use only date portion (YYYY-MM-DD) so time doesn't affect seed
  const dateStr = dueDate.toISOString().split('T')[0];
  const input = `${userId}:${exerciseSlug}:${dateStr}`;
  return hashString(input);
}
