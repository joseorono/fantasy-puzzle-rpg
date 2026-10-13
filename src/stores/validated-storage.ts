import type { SyncStorage } from 'jotai/vanilla/utils/atomWithStorage';
import type { z } from 'zod';
import { readPersistedValue, writePersistedValue } from '~/lib/storage';

/**
 * Storage backend for `atomWithStorage` that validates what it reads.
 * Jotai otherwise trusts whatever JSON sits in localStorage and hands it back as
 * the atom's declared type, so a stale or hand-edited entry would slip through
 * untyped; anything failing `schema` falls back to the atom's initial value.
 * @param schema Zod schema the persisted value must satisfy.
 */
export function createValidatedStorage<T>(schema: z.ZodType<T>): SyncStorage<T> {
  return {
    getItem: (key, initialValue) => readPersistedValue(key, schema, initialValue),
    setItem: (key, value) => writePersistedValue(key, value),
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Storage unavailable (private mode / disabled)
      }
    },
    // Keeps atoms in sync when another tab changes the same setting.
    subscribe: (key, callback, initialValue) => {
      function handleStorage(event: StorageEvent) {
        if (event.key !== key) return;
        callback(readPersistedValue(key, schema, initialValue));
      }
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    },
  };
}
