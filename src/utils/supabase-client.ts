/**
 * Supabase Client - Production Configuration
 * 
 * Handles:
 * - Anonymous authentication
 * - Real-time presence for study sessions
 * - IP-based geolocation (no GPS prompts)
 * - Database operations for study sessions
 */

import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import { getEnv, isEnvConfigured } from './env-config';

// Get validated environment configuration
const env = getEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

// Use the centralized validation
const isConfigured = isEnvConfigured();

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the Supabase client singleton
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isConfigured) {
    console.warn('[Supabase] Not configured properly');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'x-application-name': 'timekeeper-study-map',
        },
      },
    });
  }

  return supabaseInstance;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

/**
 * Anonymous sign-in - returns user ID
 */
export async function ensureAnonymousSession(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // Check existing session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }

    // Sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('[Supabase] Anonymous sign-in failed:', error.message);
      return null;
    }

    return data.user?.id || null;
  } catch (err) {
    console.error('[Supabase] Session error:', err);
    return null;
  }
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Create a presence channel for real-time tracking
 */
export function createPresenceChannel(channelName: string): RealtimeChannel | null {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  return supabase.channel(channelName, {
    config: {
      presence: {
        key: '',
      },
    },
  });
}

/**
 * Study session data interface
 */
export interface StudySession {
  id: string;
  exam_slug: string | null;
  exam_name: string | null;
  subject: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  avatar_seed: string;
  started_at: string;
}

/**
 * Location data from IP geolocation
 */
export interface LocationData {
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  country: string;
  accuracy: number; // km radius
}

// =====================================================
// IP Geolocation (no GPS prompt required)
// =====================================================

/**
 * Get user location from IP address
 * Uses free IP geolocation APIs - no GPS prompt needed
 */
export async function getLocationFromIP(): Promise<LocationData | null> {
  // Try multiple free IP geolocation services
  const services = [
    fetchIpApi,
    fetchIpInfo,
    fetchGeoIpify,
  ];

  for (const service of services) {
    try {
      const location = await service();
      if (location && location.latitude && location.longitude) {
        // Cache the location
        saveLocationToCache(location);
        return location;
      }
    } catch (err) {
      console.warn('[Geolocation] Service failed, trying next...', err);
    }
  }

  // Fallback to cached location
  const cached = getLocationFromCache();
  if (cached) return cached;

  // Ultimate fallback - Delhi, India (center of country)
  return {
    latitude: 28.6139,
    longitude: 77.2090,
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    accuracy: 100,
  };
}

/**
 * ip-api.com - Free, no API key required
 */
async function fetchIpApi(): Promise<LocationData | null> {
  const response = await fetch('http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon');
  const data = await response.json();
  
  if (data.status !== 'success') return null;
  
  return {
    latitude: data.lat,
    longitude: data.lon,
    city: data.city,
    state: data.regionName,
    country: data.country || 'India',
    accuracy: 25,
  };
}

/**
 * ipinfo.io - Free tier available
 */
async function fetchIpInfo(): Promise<LocationData | null> {
  const response = await fetch('https://ipinfo.io/json');
  const data = await response.json();
  
  if (!data.loc) return null;
  
  const [lat, lon] = data.loc.split(',').map(Number);
  
  return {
    latitude: lat,
    longitude: lon,
    city: data.city,
    state: data.region,
    country: data.country || 'India',
    accuracy: 25,
  };
}

/**
 * geo.ipify.org - Free tier
 */
async function fetchGeoIpify(): Promise<LocationData | null> {
  const response = await fetch('https://geo.ipify.org/api/v2/country,city');
  const data = await response.json();
  
  if (!data.location) return null;
  
  return {
    latitude: data.location.lat,
    longitude: data.location.lng,
    city: data.location.city,
    state: data.location.region,
    country: data.location.country || 'India',
    accuracy: 25,
  };
}

/**
 * Cache location in localStorage
 */
function saveLocationToCache(location: LocationData): void {
  try {
    localStorage.setItem('timekeeper-user-location', JSON.stringify({
      ...location,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get cached location (valid for 1 hour)
 */
function getLocationFromCache(): LocationData | null {
  try {
    const cached = localStorage.getItem('timekeeper-user-location');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const age = Date.now() - (data.timestamp || 0);
    
    // Cache valid for 1 hour
    if (age > 3600000) return null;
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      state: data.state,
      country: data.country || 'India',
      accuracy: data.accuracy || 25,
    };
  } catch {
    return null;
  }
}

// =====================================================
// Database Operations
// =====================================================

/**
 * Get all active study sessions from database
 */
export async function getActiveStudySessions(): Promise<StudySession[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc('get_active_study_sessions');
    
    if (error) {
      console.error('[Supabase] Error fetching sessions:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('[Supabase] Failed to get sessions:', err);
    return [];
  }
}

/**
 * Start or update a study session
 */
export async function upsertStudySession(params: {
  examSlug?: string | null;
  examName?: string | null;
  subject?: string | null;
  sessionName?: string | null;
  latitude?: number;
  longitude?: number;
  city?: string | null;
  state?: string | null;
  avatarSeed?: string;
}): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('upsert_study_session', {
      p_exam_slug: params.examSlug || null,
      p_exam_name: params.examName || null,
      p_subject: params.subject || null,
      p_session_name: params.sessionName || null,
      p_latitude: params.latitude || null,
      p_longitude: params.longitude || null,
      p_city: params.city || null,
      p_state: params.state || null,
      p_avatar_seed: params.avatarSeed || null,
    });

    if (error) {
      console.error('[Supabase] Error upserting session:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Supabase] Failed to upsert session:', err);
    return null;
  }
}

/**
 * End the current study session
 */
export async function endCurrentStudySession(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.rpc('end_study_session');
    return !error;
  } catch {
    return false;
  }
}

/**
 * Send heartbeat to keep session alive
 */
export async function heartbeatSession(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.rpc('heartbeat_session');
    return !error;
  } catch {
    return false;
  }
}

/**
 * Subscribe to real-time changes in study sessions
 */
export function subscribeToStudySessions(
  callback: (sessions: StudySession[]) => void
): (() => void) | null {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const channel = supabase
    .channel('study-sessions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'study_sessions',
        filter: 'is_active=eq.true',
      },
      async () => {
        // Refetch all active sessions on any change
        const sessions = await getActiveStudySessions();
        callback(sessions);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

// =====================================================
// Indian Geography Data
// =====================================================

export const INDIAN_STATES: Record<string, { lat: number; lng: number; name: string }> = {
  'AN': { lat: 11.7401, lng: 92.6586, name: 'Andaman and Nicobar Islands' },
  'AP': { lat: 15.9129, lng: 79.7400, name: 'Andhra Pradesh' },
  'AR': { lat: 28.2180, lng: 94.7278, name: 'Arunachal Pradesh' },
  'AS': { lat: 26.2006, lng: 92.9376, name: 'Assam' },
  'BR': { lat: 25.0961, lng: 85.3131, name: 'Bihar' },
  'CH': { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  'CT': { lat: 21.2787, lng: 81.8661, name: 'Chhattisgarh' },
  'DL': { lat: 28.7041, lng: 77.1025, name: 'Delhi' },
  'GA': { lat: 15.2993, lng: 74.1240, name: 'Goa' },
  'GJ': { lat: 22.2587, lng: 71.1924, name: 'Gujarat' },
  'HR': { lat: 29.0588, lng: 76.0856, name: 'Haryana' },
  'HP': { lat: 31.1048, lng: 77.1734, name: 'Himachal Pradesh' },
  'JK': { lat: 33.7782, lng: 76.5762, name: 'Jammu and Kashmir' },
  'JH': { lat: 23.6102, lng: 85.2799, name: 'Jharkhand' },
  'KA': { lat: 15.3173, lng: 75.7139, name: 'Karnataka' },
  'KL': { lat: 10.8505, lng: 76.2711, name: 'Kerala' },
  'LA': { lat: 34.1526, lng: 77.5770, name: 'Ladakh' },
  'MP': { lat: 22.9734, lng: 78.6569, name: 'Madhya Pradesh' },
  'MH': { lat: 19.7515, lng: 75.7139, name: 'Maharashtra' },
  'MN': { lat: 24.6637, lng: 93.9063, name: 'Manipur' },
  'ML': { lat: 25.4670, lng: 91.3662, name: 'Meghalaya' },
  'MZ': { lat: 23.1645, lng: 92.9376, name: 'Mizoram' },
  'NL': { lat: 26.1584, lng: 94.5624, name: 'Nagaland' },
  'OD': { lat: 20.9517, lng: 85.0985, name: 'Odisha' },
  'PB': { lat: 31.1471, lng: 75.3412, name: 'Punjab' },
  'RJ': { lat: 27.0238, lng: 74.2179, name: 'Rajasthan' },
  'SK': { lat: 27.5330, lng: 88.5122, name: 'Sikkim' },
  'TN': { lat: 11.1271, lng: 78.6569, name: 'Tamil Nadu' },
  'TS': { lat: 18.1124, lng: 79.0193, name: 'Telangana' },
  'TR': { lat: 23.9408, lng: 91.9882, name: 'Tripura' },
  'UP': { lat: 26.8467, lng: 80.9462, name: 'Uttar Pradesh' },
  'UK': { lat: 30.0668, lng: 79.0193, name: 'Uttarakhand' },
  'WB': { lat: 22.9868, lng: 87.8550, name: 'West Bengal' },
  'GB': { lat: 35.8884, lng: 74.4584, name: 'Gilgit-Baltistan' }, // Full Kashmir
};

export const MAJOR_CITIES: Array<{ name: string; state: string; lat: number; lng: number }> = [
  { name: 'Mumbai', state: 'MH', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', state: 'DL', lat: 28.6139, lng: 77.2090 },
  { name: 'Bangalore', state: 'KA', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'TS', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', state: 'TN', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'WB', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', state: 'GJ', lat: 23.0225, lng: 72.5714 },
  { name: 'Pune', state: 'MH', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur', state: 'RJ', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', state: 'UP', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', state: 'UP', lat: 26.4499, lng: 80.3319 },
  { name: 'Nagpur', state: 'MH', lat: 21.1458, lng: 79.0882 },
  { name: 'Indore', state: 'MP', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', state: 'MP', lat: 23.2599, lng: 77.4126 },
  { name: 'Patna', state: 'BR', lat: 25.5941, lng: 85.1376 },
  { name: 'Kota', state: 'RJ', lat: 25.2138, lng: 75.8648 },
  { name: 'Chandigarh', state: 'CH', lat: 30.7333, lng: 76.7794 },
  { name: 'Coimbatore', state: 'TN', lat: 11.0168, lng: 76.9558 },
  { name: 'Thiruvananthapuram', state: 'KL', lat: 8.5241, lng: 76.9366 },
  { name: 'Visakhapatnam', state: 'AP', lat: 17.6868, lng: 83.2185 },
  { name: 'Bhubaneswar', state: 'OD', lat: 20.2961, lng: 85.8245 },
  { name: 'Guwahati', state: 'AS', lat: 26.1445, lng: 91.7362 },
  { name: 'Ranchi', state: 'JH', lat: 23.3441, lng: 85.3096 },
  { name: 'Raipur', state: 'CT', lat: 21.2514, lng: 81.6296 },
  { name: 'Srinagar', state: 'JK', lat: 34.0837, lng: 74.7973 },
  { name: 'Dehradun', state: 'UK', lat: 30.3165, lng: 78.0322 },
  { name: 'Varanasi', state: 'UP', lat: 25.3176, lng: 82.9739 },
  { name: 'Allahabad', state: 'UP', lat: 25.4358, lng: 81.8463 },
  { name: 'Gilgit', state: 'GB', lat: 35.9208, lng: 74.3144 },
  { name: 'Skardu', state: 'GB', lat: 35.2971, lng: 75.6333 },
];

export type { SupabaseClient, RealtimeChannel };
