/**
 * Typed localStorage wrapper.
 *
 * Provides get / set / remove with full generics, safe JSON parse, and a
 * fallback-to-default pattern so callers never need to handle null/undefined.
 *
 * All keys are namespaced via STORAGE_KEYS in src/types/index.ts so there is
 * a single source of truth for every key name.
 */

/** Read and JSON-parse a value; return `fallback` on any failure. */
export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON-stringify and write a value. Silently swallows QuotaExceededError. */
export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // QuotaExceededError — silently ignore; data won't be persisted this write
  }
}

/** Remove a key from localStorage. */
export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Read → transform → write in a single call, avoiding
 * the read-parse-write ceremony at every call site.
 *
 * @example
 * storageUpdate<number>("count", 0, (n) => n + 1);
 */
export function storageUpdate<T>(
  key: string,
  fallback: T,
  updater: (current: T) => T
): T {
  const current = storageGet<T>(key, fallback);
  const next = updater(current);
  storageSet(key, next);
  return next;
}
