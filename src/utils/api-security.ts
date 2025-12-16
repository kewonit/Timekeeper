/**
 * API Security Utilities
 * 
 * Production-grade security helpers for:
 * - Input validation and sanitization
 * - Rate limiting
 * - Error handling
 * - Request validation
 */

// =====================================================
// Input Validation & Sanitization
// =====================================================

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: unknown, maxLength = 255): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'string') return null;
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);
  
  // Remove null bytes and control characters (except newlines/tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Escape HTML entities to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return sanitized || null;
}

/**
 * Validate and sanitize exam slug
 */
export function sanitizeSlug(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'string') return null;
  
  // Only allow alphanumeric, hyphens, underscores
  const sanitized = input
    .trim()
    .toLowerCase()
    .slice(0, 100)
    .replace(/[^a-z0-9\-_]/g, '');
  
  return sanitized || null;
}

/**
 * Validate latitude value
 */
export function validateLatitude(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  
  const num = typeof input === 'number' ? input : parseFloat(String(input));
  
  if (isNaN(num) || num < -90 || num > 90) return null;
  
  // Round to 6 decimal places (about 10cm precision)
  return Math.round(num * 1000000) / 1000000;
}

/**
 * Validate longitude value
 */
export function validateLongitude(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  
  const num = typeof input === 'number' ? input : parseFloat(String(input));
  
  if (isNaN(num) || num < -180 || num > 180) return null;
  
  // Round to 6 decimal places
  return Math.round(num * 1000000) / 1000000;
}

/**
 * Validate coordinates are within India bounds
 */
export function validateIndianCoordinates(
  lat: number | null, 
  lng: number | null
): { latitude: number; longitude: number } | null {
  if (lat === null || lng === null) return null;
  
  // India approximate bounds (generous to include Kashmir, islands)
  const INDIA_BOUNDS = {
    minLat: 5.0,   // South
    maxLat: 38.0,  // North (includes full Kashmir)
    minLng: 67.0,  // West
    maxLng: 98.0,  // East (Arunachal)
  };
  
  if (
    lat < INDIA_BOUNDS.minLat || lat > INDIA_BOUNDS.maxLat ||
    lng < INDIA_BOUNDS.minLng || lng > INDIA_BOUNDS.maxLng
  ) {
    return null;
  }
  
  return { latitude: lat, longitude: lng };
}

/**
 * Validate avatar seed (UUID-like or simple string)
 */
export function validateAvatarSeed(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'string') return null;
  
  // Only allow alphanumeric, hyphens
  const sanitized = input
    .trim()
    .slice(0, 64)
    .replace(/[^a-zA-Z0-9\-]/g, '');
  
  return sanitized || null;
}

// =====================================================
// Rate Limiting
// =====================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple client-side rate limiter
 * Prevents excessive API calls from the same operation
 */
export function checkRateLimit(
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // Clean up expired entries
  if (entry && entry.resetAt <= now) {
    rateLimitStore.delete(key);
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
  
  if (current.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: current.resetAt - now 
    };
  }
  
  current.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetIn: current.resetAt - now 
  };
}

/**
 * Decorator for rate-limited operations (returns default value when rate limited)
 */
export async function withRateLimit<T>(
  key: string,
  operation: () => Promise<T>,
  maxRequests: number = 10,
  windowMs: number = 60000,
  rateLimitedValue?: T
): Promise<T> {
  const { allowed, remaining, resetIn } = checkRateLimit(key, maxRequests, windowMs);
  
  if (!allowed) {
    console.warn(`[RateLimit] Rate limit exceeded for ${key}. Reset in ${Math.ceil(resetIn / 1000)}s`);
    // Return the rate-limited value if provided, otherwise reject
    if (rateLimitedValue !== undefined) {
      return rateLimitedValue;
    }
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(resetIn / 1000)} seconds.`);
  }
  
  if (remaining < 3) {
    console.warn(`[RateLimit] Low remaining requests for ${key}: ${remaining}`);
  }
  
  return operation();
}

// =====================================================
// Error Handling
// =====================================================

/**
 * Safe error extraction - never expose internal details
 */
export function getSafeErrorMessage(error: unknown): string {
  // Known safe error messages to pass through
  const safeMessages = [
    'Not authenticated',
    'Session expired',
    'Rate limit exceeded',
    'Invalid input',
    'Network error',
    'Connection failed',
  ];
  
  if (error instanceof Error) {
    const message = error.message;
    
    // Check if it's a safe message to expose
    for (const safe of safeMessages) {
      if (message.toLowerCase().includes(safe.toLowerCase())) {
        return safe;
      }
    }
    
    // Log the actual error internally
    console.error('[Security] Error occurred:', error);
  }
  
  // Generic message for all other errors
  return 'An error occurred. Please try again.';
}

/**
 * Async operation wrapper with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorContext?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (errorContext) {
      console.error(`[${errorContext}]`, getSafeErrorMessage(error));
    }
    return fallback;
  }
}

// =====================================================
// Request Validation
// =====================================================

/**
 * Validate that required fields are present
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: (keyof T)[] } {
  const missing = requiredFields.filter(field => 
    data[field] === null || 
    data[field] === undefined || 
    data[field] === ''
  );
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

// =====================================================
// Session Storage Security
// =====================================================

const STORAGE_PREFIX = 'timekeeper_';

/**
 * Secure storage wrapper with prefix and JSON handling
 */
export const secureStorage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },
  
  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  },
  
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // Ignore errors
    }
  },
  
  clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Only clear our prefixed items
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore errors
    }
  },
};

// =====================================================
// Content Security
// =====================================================

/**
 * Validate URL is safe (http/https only, no javascript:, data:, etc.)
 */
export function validateSafeUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Check if we're in a secure context (HTTPS)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext ?? window.location.protocol === 'https:';
}

// =====================================================
// CSRF Protection (for form submissions)
// =====================================================

let csrfToken: string | null = null;

/**
 * Get or generate CSRF token
 */
export function getCsrfToken(): string {
  if (csrfToken) return csrfToken;
  
  csrfToken = crypto.randomUUID ? crypto.randomUUID() : 
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  return csrfToken;
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  return token === csrfToken;
}
