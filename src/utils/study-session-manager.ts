/**
 * Study Session Manager - Production Version
 * 
 * Manages real-time study sessions using Supabase database.
 * Includes demonstration accounts for map activity during low-traffic periods.
 * 
 * Features:
 * - IP-based geolocation (no GPS prompts)
 * - Real database persistence
 * - Real-time subscriptions
 * - Heartbeat for session liveness
 * - Input validation and rate limiting
 * - Demonstration accounts (DEMONSTRATION_ACCOUNT marker for removal)
 */

import {
  getSupabaseClient,
  ensureAnonymousSession,
  getCurrentUserId,
  getLocationFromIP,
  getActiveStudySessions,
  upsertStudySession,
  endCurrentStudySession,
  heartbeatSession,
  subscribeToStudySessions,
  isSupabaseConfigured,
  type StudySession as DbStudySession,
  type LocationData,
} from './supabase-client';

import { getAvatarUrl, preloadAvatars } from './notion-faces';

import {
  sanitizeString,
  sanitizeSlug,
  validateIndianCoordinates,
  validateAvatarSeed,
  withRateLimit,
  safeAsync,
  secureStorage,
} from './api-security';

// DEMONSTRATION_ACCOUNT: Import demonstration account service
import {
  initializeDemonstrationAccounts,
  stopDemonstrationAccounts,
  getDemonstrationSessions,
  subscribeToDemonstrationSessions,
  type DemonstrationSession,
} from './demonstration-accounts';

// Configuration
const HEARTBEAT_INTERVAL = 25000; // 25 seconds (sessions expire at 60s)
const SESSION_STORAGE_KEY = 'timekeeper-avatar-seed';

// Singleton state
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let unsubscribeRealtime: (() => void) | null = null;
// DEMONSTRATION_ACCOUNT: Track demonstration session unsubscribe
let unsubscribeDemonstration: (() => void) | null = null;
let currentLocation: LocationData | null = null;
let currentAvatarSeed: string | null = null;
let sessionListeners: Set<(sessions: StudyPresence[]) => void> = new Set();
let connectionListeners: Set<(status: ConnectionStatus) => void> = new Set();
let currentStatus: ConnectionStatus = 'disconnected';
// DEMONSTRATION_ACCOUNT: Cache for merging sessions
let lastRealSessions: DbStudySession[] = [];
let lastDemonstrationSessions: DemonstrationSession[] = [];

/**
 * Connection status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Study presence data for map display
 */
export interface StudyPresence {
  id: string;
  examSlug: string | null;
  examName: string | null;
  subject: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  avatarUrl: string;
  startedAt: string;
}

/**
 * Current session info
 */
export interface CurrentSession {
  examSlug: string | null;
  examName: string | null;
  subject: string | null;
  city: string | null;
  state: string | null;
}

/**
 * Get or create avatar seed for consistent appearance
 * Uses secure storage with validation
 */
function getOrCreateAvatarSeed(): string {
  if (currentAvatarSeed) return currentAvatarSeed;
  
  // Try to get from secure storage
  const saved = secureStorage.get<string>('avatar_seed', '');
  const validated = validateAvatarSeed(saved);
  
  if (validated) {
    currentAvatarSeed = validated;
    return validated;
  }
  
  // Generate new seed
  const seed = crypto.randomUUID ? crypto.randomUUID() : 
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  currentAvatarSeed = seed;
  secureStorage.set('avatar_seed', seed);
  
  return seed;
}

/**
 * Update connection status and notify listeners
 */
function setConnectionStatus(status: ConnectionStatus): void {
  if (currentStatus === status) return;
  currentStatus = status;
  
  connectionListeners.forEach(cb => {
    try { cb(status); } catch (e) { console.error('[Session] Listener error:', e); }
  });
}

/**
 * Notify session listeners with converted data
 * DEMONSTRATION_ACCOUNT: Merges real sessions with demonstration sessions
 * Preloads avatars in the background for smooth rendering
 */
function notifySessionListeners(dbSessions: DbStudySession[]): void {
  // Cache real sessions for merging with demonstration sessions
  lastRealSessions = dbSessions;
  
  // Convert real sessions to presence format
  const realPresences: StudyPresence[] = dbSessions.map(s => ({
    id: s.id,
    examSlug: s.exam_slug,
    examName: s.exam_name,
    subject: s.subject,
    latitude: s.latitude,
    longitude: s.longitude,
    city: s.city,
    state: s.state,
    avatarUrl: getAvatarUrl(s.avatar_seed),
    startedAt: s.started_at,
  }));
  
  // DEMONSTRATION_ACCOUNT: Convert demonstration sessions to presence format
  const demoPresences: StudyPresence[] = lastDemonstrationSessions.map(s => ({
    id: s.id,
    examSlug: s.exam_slug,
    examName: s.exam_name,
    subject: s.subject,
    latitude: s.latitude,
    longitude: s.longitude,
    city: s.city,
    state: s.state,
    avatarUrl: getAvatarUrl(s.avatar_seed),
    startedAt: s.started_at,
  }));
  
  // Merge and deduplicate (real sessions take priority)
  const allPresences = [...realPresences, ...demoPresences];
  
  // Preload avatars in the background (don't block notifications)
  if (typeof window !== 'undefined') {
    const avatarSeeds = [
      ...dbSessions.map(s => s.avatar_seed),
      ...lastDemonstrationSessions.map(s => s.avatar_seed)
    ];
    
    preloadAvatars(avatarSeeds).catch((err) => {
      // Preload failure is non-critical - avatars will load on-demand from network
      // This can fail due to network issues or CORS, but doesn't affect functionality
      console.debug('[Session] Avatar preload failed (non-critical):', err);
    });
  }
  
  sessionListeners.forEach(cb => {
    try { cb(allPresences); } catch (e) { console.error('[Session] Listener error:', e); }
  });
}

/**
 * DEMONSTRATION_ACCOUNT: Handle demonstration session updates
 */
function handleDemonstrationSessionUpdate(demoSessions: DemonstrationSession[]): void {
  lastDemonstrationSessions = demoSessions;
  // Re-notify listeners with merged data
  notifySessionListeners(lastRealSessions);
}

/**
 * Initialize the session manager
 * Connects to database and sets up real-time subscriptions
 * DEMONSTRATION_ACCOUNT: Also initializes demonstration accounts
 */
export async function initializeSessionManager(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[Session] Supabase not configured');
    setConnectionStatus('error');
    // DEMONSTRATION_ACCOUNT: Start demonstration accounts even without Supabase
    initializeDemonstrationService();
    return false;
  }
  
  setConnectionStatus('connecting');
  
  try {
    // Sign in anonymously
    const userId = await ensureAnonymousSession();
    if (!userId) {
      console.error('[Session] Failed to authenticate');
      setConnectionStatus('error');
      // DEMONSTRATION_ACCOUNT: Start demonstration accounts as fallback
      initializeDemonstrationService();
      return false;
    }
    
    // Get location from IP (no GPS prompt)
    currentLocation = await getLocationFromIP();
    
    // Set up real-time subscription
    unsubscribeRealtime = subscribeToStudySessions((sessions) => {
      notifySessionListeners(sessions);
    });
    
    // DEMONSTRATION_ACCOUNT: Initialize demonstration accounts
    initializeDemonstrationService();
    
    // Load initial sessions
    const sessions = await getActiveStudySessions();
    notifySessionListeners(sessions);
    
    setConnectionStatus('connected');
    return true;
  } catch (err) {
    console.error('[Session] Initialization failed:', err);
    setConnectionStatus('error');
    // DEMONSTRATION_ACCOUNT: Start demonstration accounts as fallback
    initializeDemonstrationService();
    return false;
  }
}

/**
 * DEMONSTRATION_ACCOUNT: Initialize demonstration service and subscribe to updates
 */
function initializeDemonstrationService(): void {
  // Only initialize once
  if (unsubscribeDemonstration) return;
  
  try {
    // Start the demonstration account service
    initializeDemonstrationAccounts();
    
    // Subscribe to demonstration session updates
    unsubscribeDemonstration = subscribeToDemonstrationSessions((sessions) => {
      handleDemonstrationSessionUpdate(sessions);
    });
    
    console.log('[Session] Demonstration accounts initialized');
  } catch (err) {
    console.error('[Session] Failed to initialize demonstration accounts:', err);
  }
}

/**
 * Start or update a study session
 * Includes rate limiting and input validation
 */
export async function startStudySession(
  examSlug?: string | null,
  examName?: string | null,
  subject?: string | null
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[Session] Supabase not configured');
    return false;
  }
  
  // Rate limit: max 5 session starts per minute, return false if rate limited
  return withRateLimit('session_start', async () => {
    try {
      // Ensure we have a user session
      const userId = await getCurrentUserId();
      if (!userId) {
        const newUserId = await ensureAnonymousSession();
        if (!newUserId) {
          console.error('[Session] Could not authenticate');
          return false;
        }
      }
      
      // Get location if not already cached
      if (!currentLocation) {
        currentLocation = await getLocationFromIP();
      }
      
      // Validate location is within India
      const validatedCoords = validateIndianCoordinates(
        currentLocation?.latitude ?? null,
        currentLocation?.longitude ?? null
      );
      
      // Sanitize input strings
      const sanitizedSlug = sanitizeSlug(examSlug);
      const sanitizedName = sanitizeString(examName, 100);
      const sanitizedSubject = sanitizeString(subject, 100);
      
      // Upsert session to database
      const sessionId = await upsertStudySession({
        examSlug: sanitizedSlug,
        examName: sanitizedName,
        subject: sanitizedSubject,
        latitude: validatedCoords?.latitude ?? currentLocation?.latitude,
        longitude: validatedCoords?.longitude ?? currentLocation?.longitude,
        city: sanitizeString(currentLocation?.city, 50),
        state: sanitizeString(currentLocation?.state, 50),
        avatarSeed: getOrCreateAvatarSeed(),
      });
    
      if (!sessionId) {
        console.error('[Session] Failed to create session');
        return false;
      }
      
      // Start heartbeat
      startHeartbeat();
      
      setConnectionStatus('connected');
      return true;
    } catch (err) {
      console.error('[Session] Start failed:', err);
      return false;
    }
  }, 5, 60000, false); // 5 requests per minute, return false if rate limited
}

/**
 * Update the current exam/subject
 * Includes input sanitization
 */
export async function updateStudyExam(
  examSlug: string | null,
  examName: string | null,
  subject?: string | null
): Promise<void> {
  return safeAsync(async () => {
    // Validate location
    const validatedCoords = validateIndianCoordinates(
      currentLocation?.latitude ?? null,
      currentLocation?.longitude ?? null
    );
    
    await upsertStudySession({
      examSlug: sanitizeSlug(examSlug),
      examName: sanitizeString(examName, 100),
      subject: sanitizeString(subject, 100),
      latitude: validatedCoords?.latitude ?? currentLocation?.latitude,
      longitude: validatedCoords?.longitude ?? currentLocation?.longitude,
      city: sanitizeString(currentLocation?.city, 50),
      state: sanitizeString(currentLocation?.state, 50),
      avatarSeed: getOrCreateAvatarSeed(),
    });
  }, undefined, 'Session');
}

/**
 * End the current study session
 */
export async function endStudySession(): Promise<void> {
  stopHeartbeat();
  
  try {
    await endCurrentStudySession();
  } catch (err) {
    console.error('[Session] End session failed:', err);
  }
  
  setConnectionStatus('disconnected');
}

/**
 * Start the heartbeat timer
 */
function startHeartbeat(): void {
  stopHeartbeat();
  
  heartbeatTimer = setInterval(async () => {
    try {
      const success = await heartbeatSession();
      if (!success) {
        console.warn('[Session] Heartbeat failed');
      }
    } catch (err) {
      console.error('[Session] Heartbeat error:', err);
    }
  }, HEARTBEAT_INTERVAL);
}

/**
 * Stop the heartbeat timer
 */
function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/**
 * Get current active sessions
 * DEMONSTRATION_ACCOUNT: Includes demonstration sessions in the result
 * Preloads avatars in the background for smooth rendering
 */
export async function fetchActiveSessions(): Promise<StudyPresence[]> {
  try {
    const sessions = await getActiveStudySessions();
    const realPresences: StudyPresence[] = sessions.map(s => ({
      id: s.id,
      examSlug: s.exam_slug,
      examName: s.exam_name,
      subject: s.subject,
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city,
      state: s.state,
      avatarUrl: getAvatarUrl(s.avatar_seed),
      startedAt: s.started_at,
    }));
    
    // DEMONSTRATION_ACCOUNT: Add demonstration sessions
    const demoPresences: StudyPresence[] = getDemonstrationSessions().map(s => ({
      id: s.id,
      examSlug: s.exam_slug,
      examName: s.exam_name,
      subject: s.subject,
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city,
      state: s.state,
      avatarUrl: getAvatarUrl(s.avatar_seed),
      startedAt: s.started_at,
    }));
    
    const allPresences = [...realPresences, ...demoPresences];
    
    // Preload all avatars in the background (don't block return)
    // This ensures avatars are cached for instant display
    if (typeof window !== 'undefined') {
      const avatarSeeds = [
        ...sessions.map(s => s.avatar_seed),
        ...getDemonstrationSessions().map(s => s.avatar_seed)
      ];
      
      // Preload avatars without blocking the return
      // Failure is non-critical - avatars will load on-demand if preload fails
      preloadAvatars(avatarSeeds).catch(err => {
        console.debug('[Session] Avatar preload failed (non-critical):', err);
      });
    }
    
    return allPresences;
  } catch (err) {
    console.error('[Session] Fetch failed:', err);
    // DEMONSTRATION_ACCOUNT: Return demonstration sessions even if real fetch fails
    const demoSessions = getDemonstrationSessions();
    const demoPresences = demoSessions.map(s => ({
      id: s.id,
      examSlug: s.exam_slug,
      examName: s.exam_name,
      subject: s.subject,
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city,
      state: s.state,
      avatarUrl: getAvatarUrl(s.avatar_seed),
      startedAt: s.started_at,
    }));
    
    // Preload demo avatars too (best effort, non-blocking)
    if (typeof window !== 'undefined') {
      // Preload failure is non-critical - avatars will load on-demand from network
      preloadAvatars(demoSessions.map(s => s.avatar_seed)).catch(() => {
        // Silent - already logged at higher level if needed
      });
    }
    
    return demoPresences;
  }
}

/**
 * Subscribe to session updates
 */
export function onPresenceUpdate(callback: (presences: StudyPresence[]) => void): () => void {
  sessionListeners.add(callback);
  return () => sessionListeners.delete(callback);
}

/**
 * Subscribe to connection status changes
 */
export function onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
  connectionListeners.add(callback);
  // Immediately notify with current status
  callback(currentStatus);
  return () => connectionListeners.delete(callback);
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

/**
 * Get current location (from IP)
 */
export function getCurrentLocation(): LocationData | null {
  return currentLocation;
}

/**
 * Check if session manager is ready
 */
export function isSessionActive(): boolean {
  return currentStatus === 'connected' && heartbeatTimer !== null;
}

/**
 * Cleanup - call on page unload
 * DEMONSTRATION_ACCOUNT: Also cleans up demonstration service
 */
export function cleanup(): void {
  stopHeartbeat();
  
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
    unsubscribeRealtime = null;
  }
  
  // DEMONSTRATION_ACCOUNT: Cleanup demonstration subscription
  if (unsubscribeDemonstration) {
    unsubscribeDemonstration();
    unsubscribeDemonstration = null;
  }
  
  // DEMONSTRATION_ACCOUNT: Stop demonstration service
  stopDemonstrationAccounts();
  
  // Try to end session synchronously
  endCurrentStudySession().catch(() => {});
}

// Page lifecycle handlers
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Send final heartbeat before hiding
      heartbeatSession().catch(() => {});
    }
  });
}
