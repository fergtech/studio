/**
 * Cloudflare KV client for caching AI results
 * Uses Cloudflare REST API (works from Vercel)
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const NAMESPACE_ID = process.env.KV_NAMESPACE_ID!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

const KV_API_BASE = `https://api.cloudflare.com/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}`;

interface KVGetOptions {
  cacheTtl?: number;
}

interface KVPutOptions {
  expirationTtl?: number; // Time to live in seconds
}

/**
 * Get a value from Cloudflare KV
 * @param key Cache key
 * @param options Cache options
 * @returns Cached value or null if not found/expired
 */
export async function kvGet<T = any>(
  key: string,
  options?: KVGetOptions
): Promise<T | null> {
  try {
    if (!ACCOUNT_ID || !NAMESPACE_ID || !API_TOKEN) {
      console.warn('KV not configured, skipping cache read');
      return null;
    }

    const response = await fetch(`${KV_API_BASE}/values/${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      // @ts-ignore - Next.js specific cache option
      next: { revalidate: options?.cacheTtl || 3600 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Key not found
      }
      throw new Error(`KV GET failed: ${response.status}`);
    }

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as T;
    } catch {
      // If not JSON, return as string
      return text as T;
    }
  } catch (error) {
    console.error('KV get error:', error);
    return null; // Fail gracefully
  }
}

/**
 * Put a value into Cloudflare KV
 * @param key Cache key
 * @param value Value to cache (will be JSON stringified)
 * @param options Cache options
 */
export async function kvPut(
  key: string,
  value: any,
  options?: KVPutOptions
): Promise<boolean> {
  try {
    if (!ACCOUNT_ID || !NAMESPACE_ID || !API_TOKEN) {
      console.warn('KV not configured, skipping cache write');
      return false;
    }

    const body = typeof value === 'string' ? value : JSON.stringify(value);

    const url = new URL(`${KV_API_BASE}/values/${encodeURIComponent(key)}`);
    if (options?.expirationTtl) {
      url.searchParams.set('expiration_ttl', options.expirationTtl.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`KV PUT failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('KV put error:', error);
    return false; // Fail gracefully
  }
}

/**
 * Delete a value from Cloudflare KV
 * @param key Cache key
 */
export async function kvDelete(key: string): Promise<boolean> {
  try {
    if (!ACCOUNT_ID || !NAMESPACE_ID || !API_TOKEN) {
      console.warn('KV not configured, skipping cache delete');
      return false;
    }

    const response = await fetch(`${KV_API_BASE}/values/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`KV DELETE failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('KV delete error:', error);
    return false; // Fail gracefully
  }
}

/**
 * Generate a cache key for topic detection
 * @param content Post content to classify
 * @returns Cache key
 */
export function generateTopicCacheKey(content: string): string {
  // Use first 200 chars to create a stable key
  const normalized = content.toLowerCase().trim().slice(0, 200);
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `topic:${Math.abs(hash)}`;
}

/**
 * Cache-aware topic detection wrapper
 * @param content Content to classify
 * @param detectFn Function to detect topics (only called if cache miss)
 * @param ttl Cache TTL in seconds (default: 7 days)
 * @returns Topic detection result
 */
export async function getCachedTopics<T>(
  content: string,
  detectFn: () => Promise<T>,
  ttl: number = 604800 // 7 days
): Promise<T> {
  const cacheKey = generateTopicCacheKey(content);

  // Try cache first
  const cached = await kvGet<T>(cacheKey);
  if (cached) {
    console.log(`✅ KV cache HIT for key: ${cacheKey}`);
    return cached;
  }

  console.log(`❌ KV cache MISS for key: ${cacheKey}`);

  // Cache miss - call detection function
  const result = await detectFn();

  // Store in cache (fire and forget)
  kvPut(cacheKey, result, { expirationTtl: ttl }).catch(err =>
    console.error('Failed to cache topic result:', err)
  );

  return result;
}
