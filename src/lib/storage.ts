import type { z } from 'zod';

/**
 * Reads a JSON value from localStorage and validates it against a schema.
 * Returns the fallback when the key is missing, unparseable, or fails validation,
 * so corrupt storage can never leak an untyped value into game state.
 * @param key localStorage key to read.
 * @param schema Zod schema the stored value must satisfy.
 * @param fallback Value returned when nothing valid is stored.
 */
export function readPersistedValue<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    // Unparseable JSON, or localStorage unavailable (private mode / disabled)
    return fallback;
  }
}

/**
 * Writes a JSON value to localStorage. Persisting is best-effort: a full or
 * blocked localStorage must not break the caller.
 * @param key localStorage key to write.
 * @param value Value to serialize.
 */
export function writePersistedValue<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — the in-memory value still applies this session
  }
}
