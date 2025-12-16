/**
 * DiceBear Avatar Generator with Caching
 * 
 * Generates professional, consistent avatar URLs using DiceBear API.
 * Each user gets a unique but deterministic avatar based on their ID/seed.
 * 
 * Features:
 * - In-memory URL cache to prevent redundant URL generation
 * - Automatic cache cleanup for memory management
 * - Browser cache-friendly headers (SVG format)
 * 
 * Uses the "lorelei" style for professional-looking human avatars.
 * https://www.dicebear.com/styles/lorelei/
 */

// Available avatar styles - using professional human-like styles
const AVATAR_STYLES = [
  'lorelei',      // Professional illustrated faces
  'avataaars',    // Popular cartoon style
  'personas',     // Simple professional
  'notionists',   // Notion-inspired
  'micah',        // Modern illustrated
] as const;

// Default style for consistency
const DEFAULT_STYLE = 'lorelei';

// In-memory cache for avatar URLs
// Key format: "seed|style|size"
const avatarUrlCache = new Map<string, string>();

// Cache size limit to prevent memory bloat
const MAX_CACHE_SIZE = 500;

// Cleanup cache when it grows too large
function cleanupCache(): void {
  if (avatarUrlCache.size > MAX_CACHE_SIZE) {
    // Remove oldest 100 entries
    const entriesToRemove = Array.from(avatarUrlCache.keys()).slice(0, 100);
    entriesToRemove.forEach(key => avatarUrlCache.delete(key));
  }
}

/**
 * Generate a DiceBear avatar URL from a seed string (with caching)
 * 
 * @param seed - Unique identifier (user ID, session ID, etc.)
 * @param style - Avatar style (default: lorelei)
 * @param size - Image size (default: 128)
 * @returns URL to the avatar image (cached if previously generated)
 */
export function getAvatarUrl(
  seed: string, 
  style: typeof AVATAR_STYLES[number] = DEFAULT_STYLE,
  size: number = 128
): string {
  // Create cache key
  const cacheKey = `${seed}|${style}|${size}`;
  
  // Check cache first
  const cached = avatarUrlCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Generate new URL
  const encodedSeed = encodeURIComponent(seed);
  const url = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodedSeed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear&radius=50`;
  
  // Store in cache
  avatarUrlCache.set(cacheKey, url);
  
  // Periodic cleanup
  cleanupCache();
  
  return url;
}

/**
 * Get avatar URL specifically for Notion-style faces
 * (Legacy function name for compatibility)
 */
export function getNotionFaceUrl(seed: string): string {
  return getAvatarUrl(seed, 'lorelei', 128);
}

/**
 * Get avatar URL for map markers (smaller, optimized)
 */
export function getMapMarkerAvatar(seed: string): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodedSeed}&size=80&backgroundColor=ffffff&radius=50`;
}

/**
 * Get a random avatar URL
 */
export function getRandomAvatarUrl(): string {
  const randomSeed = `random_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  return getAvatarUrl(randomSeed);
}

/**
 * In-memory cache for preloaded avatar images
 * Stores Image objects to leverage browser's memory cache
 */
const preloadedAvatars = new Map<string, HTMLImageElement>();

/**
 * Preload an avatar image into browser cache (returns a promise)
 * Also stores the Image object in memory for instant access
 * 
 * @param seed - Avatar seed
 * @param style - Avatar style
 * @param size - Image size
 */
export function preloadAvatar(
  seed: string,
  style: typeof AVATAR_STYLES[number] = DEFAULT_STYLE,
  size: number = 128
): Promise<void> {
  const cacheKey = `${seed}|${style}|${size}`;
  
  // Check if already preloaded
  if (preloadedAvatars.has(cacheKey)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = getAvatarUrl(seed, style, size);
    
    img.onload = () => {
      // Store in memory cache for instant reuse
      preloadedAvatars.set(cacheKey, img);
      
      // Cleanup old entries if cache grows too large
      if (preloadedAvatars.size > MAX_CACHE_SIZE) {
        const oldKeys = Array.from(preloadedAvatars.keys()).slice(0, 100);
        oldKeys.forEach(key => preloadedAvatars.delete(key));
      }
      
      resolve();
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load avatar: ${seed}`));
    };
    
    // Set crossOrigin to enable caching from external source
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/**
 * Preload multiple avatars in parallel
 * Useful for preloading all visible avatars on map
 * Uses Promise.allSettled to continue even if some avatars fail
 * 
 * @param seeds - Array of avatar seeds to preload
 * @param style - Avatar style
 * @param size - Image size
 * @returns Promise that resolves when all preload attempts complete
 */
export function preloadAvatars(
  seeds: string[],
  style: typeof AVATAR_STYLES[number] = DEFAULT_STYLE,
  size: number = 128
): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(
    seeds.map(seed => preloadAvatar(seed, style, size))
  );
}

/**
 * Check if an avatar is already preloaded
 */
export function isAvatarPreloaded(
  seed: string,
  style: typeof AVATAR_STYLES[number] = DEFAULT_STYLE,
  size: number = 128
): boolean {
  const cacheKey = `${seed}|${style}|${size}`;
  return preloadedAvatars.has(cacheKey);
}

/**
 * Avatar style options for UI selection
 */
export const AVATAR_STYLE_OPTIONS = AVATAR_STYLES.map(style => ({
  value: style,
  label: style.charAt(0).toUpperCase() + style.slice(1),
  preview: `https://api.dicebear.com/9.x/${style}/svg?seed=preview`,
}));

/**
 * Clear the avatar URL cache (useful for testing or memory management)
 * Also clears preloaded images
 */
export function clearAvatarCache(): void {
  avatarUrlCache.clear();
  preloadedAvatars.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getAvatarCacheStats(): { 
  urlCacheSize: number; 
  preloadedCacheSize: number;
  maxSize: number;
} {
  return {
    urlCacheSize: avatarUrlCache.size,
    preloadedCacheSize: preloadedAvatars.size,
    maxSize: MAX_CACHE_SIZE,
  };
}

