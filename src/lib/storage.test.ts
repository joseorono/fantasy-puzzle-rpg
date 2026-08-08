import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as z from 'zod'; // This leads to a smaller bundle size somehow
import { readPersistedValue, writePersistedValue } from './storage';

const schema = z.object({ count: z.number() });
const fallback = { count: 0 };

function makeLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    _store: store,
  };
}

let storageMock: ReturnType<typeof makeLocalStorageMock>;

beforeEach(() => {
  storageMock = makeLocalStorageMock();
  vi.stubGlobal('localStorage', storageMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readPersistedValue', () => {
  it('returns the stored value when it satisfies the schema', () => {
    storageMock._store.set('key', JSON.stringify({ count: 5 }));
    expect(readPersistedValue('key', schema, fallback)).toEqual({ count: 5 });
  });

  it('returns the fallback for a missing key', () => {
    expect(readPersistedValue('missing', schema, fallback)).toBe(fallback);
  });

  it('returns the fallback for unparseable JSON', () => {
    storageMock._store.set('key', '{not json');
    expect(readPersistedValue('key', schema, fallback)).toBe(fallback);
  });

  it('returns the fallback when the value fails the schema', () => {
    storageMock._store.set('key', JSON.stringify({ count: 'five' }));
    expect(readPersistedValue('key', schema, fallback)).toBe(fallback);
  });

  it('returns the fallback when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(readPersistedValue('key', schema, fallback)).toBe(fallback);
  });
});

describe('writePersistedValue', () => {
  it('writes the value as JSON', () => {
    writePersistedValue('key', { count: 3 });
    expect(storageMock._store.get('key')).toBe(JSON.stringify({ count: 3 }));
  });

  it('swallows storage errors such as quota exceeded', () => {
    storageMock.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };
    expect(() => writePersistedValue('key', { count: 3 })).not.toThrow();
  });
});
