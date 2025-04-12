type CacheEntry<T> = {
  data: T
  timestamp: number
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

class ClassroomCache {
  private static instance: ClassroomCache
  private cache: Map<string, CacheEntry<any>> = new Map()

  private constructor() {}

  public static getInstance(): ClassroomCache {
    if (!ClassroomCache.instance) {
      ClassroomCache.instance = new ClassroomCache()
    }
    return ClassroomCache.instance
  }

  public get<T>(key: string): T | null {
    console.log("Checking cache for key:", key)
    const entry = this.cache.get(key)

    if (!entry) {
      console.log("Cache miss for key:", key)
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > CACHE_DURATION) {
      console.log("Cache expired for key:", key)
      this.cache.delete(key)
      return null
    }

    console.log("Cache hit for key:", key)
    return entry.data as T
  }

  public set<T>(key: string, data: T): void {
    console.log("Setting cache for key:", key)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  public clear(): void {
    this.cache.clear()
  }
}

export default ClassroomCache
