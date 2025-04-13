// lib/cache.ts

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

const cacheStore = new Map<string, CacheEntry<any>>();

export function setCache<T>(key: string, data: T, ttlInSeconds: number) {
  const expiry = Date.now() + ttlInSeconds * 1000;
  cacheStore.set(key, { data, expiry });
}

export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data;
}

export function invalidateCache(key: string) {
  cacheStore.delete(key);
}

export function clearAllCache() {
  cacheStore.clear();
}
