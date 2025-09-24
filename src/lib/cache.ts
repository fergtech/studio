// Simple in-memory cache implementation for API responses
// Optimized for social media performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Prevent memory bloat
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // If cache is getting too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Remove expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats for monitoring
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Destroy cache and cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton instance
export const apiCache = new InMemoryCache();

// Cache wrapper for API responses with stale-while-revalidate
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
  } = {}
): Promise<T> {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options;
  
  // Try to get from cache first
  const cached = apiCache.get<T>(key);
  
  if (cached) {
    // If we have cached data and stale-while-revalidate is enabled,
    // return cached data immediately but update in background
    if (staleWhileRevalidate) {
      // Fire and forget background update
      fetcher()
        .then(data => apiCache.set(key, data, ttl))
        .catch(() => {}); // Silently fail background updates
    }
    
    return cached;
  }

  // No cached data, fetch fresh data
  try {
    const data = await fetcher();
    apiCache.set(key, data, ttl);
    return data;
  } catch (error) {
    // If fetch fails and we have stale data, return it
    const staleData = apiCache.get<T>(key);
    if (staleData) {
      return staleData;
    }
    throw error;
  }
}

// Cache invalidation utilities
export const cacheUtils = {
  // Invalidate cache entries by pattern
  invalidatePattern: (pattern: string) => {
    const regex = new RegExp(pattern);
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (regex.test(key)) {
        apiCache.delete(key);
      }
    });
  },

  // Invalidate user-related cache
  invalidateUser: (userId: string) => {
    const patterns = [
      `user:${userId}`,
      `user:${userId}:.*`,
      'feed:.*', // User changes might affect feeds
      'activity:.*'
    ];
    
    patterns.forEach(pattern => cacheUtils.invalidatePattern(pattern));
  },

  // Invalidate society-related cache
  invalidateSociety: (societyId: string) => {
    const patterns = [
      `society:${societyId}`,
      `society:${societyId}:.*`,
      'societies',
      'feed:.*' // Society changes affect feeds
    ];
    
    patterns.forEach(pattern => cacheUtils.invalidatePattern(pattern));
  },

  // Invalidate feed-related cache
  invalidateFeeds: () => {
    cacheUtils.invalidatePattern('feed:.*');
    cacheUtils.invalidatePattern('activity:.*');
  },

  // Get cache statistics
  getStats: () => apiCache.getStats(),
};

// Development-only cache monitoring
if (process.env.NODE_ENV === 'development') {
  // Log cache stats every 30 seconds in development
  setInterval(() => {
    const stats = cacheUtils.getStats();
    if (stats.size > 0) {
      console.log('[Cache] Size:', stats.size, 'Keys:', stats.keys.slice(0, 5));
    }
  }, 30 * 1000);
}