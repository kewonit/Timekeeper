/**
 * Environment Configuration - Production Grade
 * 
 * Validates and provides type-safe access to environment variables.
 * Ensures proper configuration before the app runs.
 */

// =====================================================
// Environment Variable Definitions
// =====================================================

/**
 * Required public environment variables (client-side accessible)
 */
interface PublicEnvVars {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

/**
 * Optional environment variables with defaults
 */
interface OptionalEnvVars {
  SITE_URL: string;
  ENABLE_ANALYTICS: boolean;
  DEBUG_MODE: boolean;
}

// =====================================================
// Environment Validation
// =====================================================

/**
 * Validate a URL is properly formatted
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate Supabase URL format
 */
function isValidSupabaseUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  
  // Must be a supabase.co domain
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('supabase.co');
  } catch {
    return false;
  }
}

/**
 * Validate anon key format
 * Supports both legacy JWT format and new Supabase key format (sb_publishable_*)
 */
function isValidAnonKey(key: string): boolean {
  if (!key || key.length < 20) return false;
  
  // New Supabase key format: sb_publishable_* or sb_secret_*
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_')) {
    // Must be at least 30 chars and contain only safe characters
    return key.length >= 30 && /^[A-Za-z0-9_-]+$/.test(key);
  }
  
  // Legacy JWT format check (3 parts separated by dots)
  const parts = key.split('.');
  if (parts.length === 3) {
    // Each part should be base64-like
    return parts.every(part => /^[A-Za-z0-9_-]+$/.test(part));
  }
  
  // Fallback: accept any key with minimum length and safe characters
  return key.length >= 30 && /^[A-Za-z0-9_.\-]+$/.test(key);
}

// =====================================================
// Environment Access
// =====================================================

let cachedEnv: (PublicEnvVars & OptionalEnvVars) | null = null;
let validationErrors: string[] = [];

/**
 * Get and validate environment variables
 */
function loadEnvironment(): PublicEnvVars & OptionalEnvVars {
  if (cachedEnv) return cachedEnv;
  
  validationErrors = [];
  
  // Get raw values from Vite/Astro environment
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
  const siteUrl = import.meta.env.SITE || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  const enableAnalytics = import.meta.env.PUBLIC_ENABLE_ANALYTICS === 'true';
  const debugMode = import.meta.env.DEV || import.meta.env.PUBLIC_DEBUG_MODE === 'true';
  
  // Validate required variables
  if (!supabaseUrl) {
    validationErrors.push('PUBLIC_SUPABASE_URL is not set');
  } else if (!isValidSupabaseUrl(supabaseUrl)) {
    validationErrors.push('PUBLIC_SUPABASE_URL is not a valid Supabase URL');
  }
  
  if (!supabaseAnonKey) {
    validationErrors.push('PUBLIC_SUPABASE_ANON_KEY is not set');
  } else if (!isValidAnonKey(supabaseAnonKey)) {
    validationErrors.push('PUBLIC_SUPABASE_ANON_KEY is not a valid anon key format');
  }
  
  // Log warnings in development
  if (validationErrors.length > 0) {
    console.warn('[Env] Configuration warnings:', validationErrors);
  }
  
  cachedEnv = {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    SITE_URL: siteUrl,
    ENABLE_ANALYTICS: enableAnalytics,
    DEBUG_MODE: debugMode,
  };
  
  return cachedEnv;
}

/**
 * Get environment configuration (safe, validated)
 */
export function getEnv(): PublicEnvVars & OptionalEnvVars {
  return loadEnvironment();
}

/**
 * Check if all required environment variables are configured
 */
export function isEnvConfigured(): boolean {
  loadEnvironment();
  return validationErrors.length === 0;
}

/**
 * Get validation errors (for debugging)
 */
export function getEnvErrors(): string[] {
  loadEnvironment();
  return [...validationErrors];
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

/**
 * Get the current mode string
 */
export function getMode(): 'production' | 'development' | 'preview' {
  if (import.meta.env.PROD) return 'production';
  if (import.meta.env.DEV) return 'development';
  return 'preview';
}

// =====================================================
// Security Helpers
// =====================================================

/**
 * Mask sensitive values for logging
 */
export function maskSensitive(value: string, showChars: number = 4): string {
  if (!value || value.length <= showChars * 2) return '***';
  return value.slice(0, showChars) + '...' + value.slice(-showChars);
}

/**
 * Log environment status (safe for production logs)
 */
export function logEnvStatus(): void {
  const env = getEnv();
  const status = {
    supabaseConfigured: !!env.SUPABASE_URL && !!env.SUPABASE_ANON_KEY,
    supabaseUrl: env.SUPABASE_URL ? maskSensitive(env.SUPABASE_URL, 8) : 'NOT SET',
    mode: getMode(),
    analytics: env.ENABLE_ANALYTICS,
    debug: env.DEBUG_MODE,
    errors: validationErrors.length,
  };
  
  console.info('[Env] Status:', status);
}

// =====================================================
// Feature Flags
// =====================================================

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const env = getEnv();
  
  // Map feature names to conditions
  const features: Record<string, boolean> = {
    'live-map': isEnvConfigured(),
    'analytics': env.ENABLE_ANALYTICS,
    'debug-panel': env.DEBUG_MODE,
    'real-time': isEnvConfigured(),
  };
  
  return features[feature] ?? false;
}
