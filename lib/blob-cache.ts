/**
 * Persistent Blob Cache for AI Analysis Results
 * 
 * Uses Vercel Blob storage for server-side persistent caching.
 * Cache is accessible across all deployments and devices.
 * TTL: 24 hours
 */

import { put, list, del, head } from '@vercel/blob';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const BLOB_PREFIX = 'equity-cache';

interface CachedData<T> {
    data: T;
    createdAt: number;
    expiresAt: number;
    ticker: string;
    type: 'fundamental' | 'sevenPowers';
}

/**
 * Generate cache key for blob storage
 */
function getCacheKey(ticker: string, type: 'fundamental' | 'sevenPowers'): string {
    return `${BLOB_PREFIX}/${type}/${ticker.toUpperCase()}.json`;
}

/**
 * Store analysis result in Vercel Blob
 */
export async function putCache<T>(
    ticker: string,
    type: 'fundamental' | 'sevenPowers',
    data: T
): Promise<void> {
    const key = getCacheKey(ticker, type);
    const now = Date.now();

    const cached: CachedData<T> = {
        data,
        createdAt: now,
        expiresAt: now + CACHE_TTL_MS,
        ticker: ticker.toUpperCase(),
        type,
    };

    try {
        await put(key, JSON.stringify(cached), {
            access: 'public',
            addRandomSuffix: false, // Use exact key for easy lookup
        });
        console.log(`[BlobCache] Stored ${type} for ${ticker}`);
    } catch (error) {
        console.error(`[BlobCache] Failed to store ${type} for ${ticker}:`, error);
    }
}

/**
 * Retrieve analysis result from Vercel Blob
 * Returns null if not found or expired
 */
export async function getCache<T>(
    ticker: string,
    type: 'fundamental' | 'sevenPowers'
): Promise<T | null> {
    const key = getCacheKey(ticker, type);

    try {
        // Check if blob exists
        const metadata = await head(key);
        if (!metadata) {
            console.log(`[BlobCache] Miss for ${type}/${ticker}`);
            return null;
        }

        // Fetch the blob content
        const response = await fetch(metadata.url);
        if (!response.ok) {
            console.log(`[BlobCache] Failed to fetch ${type}/${ticker}`);
            return null;
        }

        const cached: CachedData<T> = await response.json();

        // Check if expired
        if (Date.now() > cached.expiresAt) {
            console.log(`[BlobCache] Expired for ${type}/${ticker}, deleting...`);
            await del(key);
            return null;
        }

        console.log(`[BlobCache] Hit for ${type}/${ticker}`);
        return cached.data;
    } catch (error: any) {
        // Blob doesn't exist (expected on first run)
        if (error.message?.includes('not found') || error.message?.includes('404')) {
            console.log(`[BlobCache] Miss for ${type}/${ticker}`);
            return null;
        }
        console.error(`[BlobCache] Error getting ${type}/${ticker}:`, error);
        return null;
    }
}

/**
 * Delete cached analysis from Vercel Blob
 */
export async function deleteCache(
    ticker: string,
    type: 'fundamental' | 'sevenPowers'
): Promise<void> {
    const key = getCacheKey(ticker, type);

    try {
        await del(key);
        console.log(`[BlobCache] Deleted ${type}/${ticker}`);
    } catch (error) {
        console.error(`[BlobCache] Failed to delete ${type}/${ticker}:`, error);
    }
}

/**
 * Check if cache exists and is valid (not expired)
 */
export async function hasValidCache(
    ticker: string,
    type: 'fundamental' | 'sevenPowers'
): Promise<boolean> {
    const data = await getCache(ticker, type);
    return data !== null;
}

/**
 * Clear all cached analysis for a specific ticker
 */
export async function clearTickerCache(ticker: string): Promise<void> {
    await Promise.all([
        deleteCache(ticker, 'fundamental'),
        deleteCache(ticker, 'sevenPowers'),
    ]);
}

/**
 * List all cached items (for debugging/monitoring)
 */
export async function listCache(): Promise<{ ticker: string; type: string; url: string }[]> {
    try {
        const { blobs } = await list({ prefix: BLOB_PREFIX });
        return blobs.map(blob => {
            const parts = blob.pathname.split('/');
            return {
                ticker: parts[2]?.replace('.json', '') || 'unknown',
                type: parts[1] || 'unknown',
                url: blob.url,
            };
        });
    } catch (error) {
        console.error('[BlobCache] Failed to list cache:', error);
        return [];
    }
}
