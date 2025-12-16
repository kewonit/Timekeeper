/**
 * Demonstration Account Service
 * 
 * Provides simulated study sessions for demonstration purposes on the live map.
 * These accounts help showcase map functionality during low-traffic periods.
 * 
 * IMPORTANT: Uses deterministic seeding based on IST date/hour so ALL clients
 * see the SAME demonstration accounts at the same time.
 * 
 * Configuration:
 * - Account count: 5-15 (deterministic based on day)
 * - Active hours: 6:00 AM to 2:00 AM IST (20 hour window)
 * - Session changes: Every 30min to 4hr (deterministic per account)
 * - Location: Major cities across India
 * 
 * REMOVAL GUIDE: To remove demonstration accounts, search for:
 * - "DEMONSTRATION_ACCOUNT" markers in this file
 * - References to "demonstration-accounts" in imports
 * 
 * @module DemonstrationAccounts
 */

import { getAvatarUrl } from './notion-faces';

// =====================================================
// DEMONSTRATION_ACCOUNT: Configuration Constants
// =====================================================

/** IST timezone offset in hours (UTC+5:30) */
const IST_OFFSET_HOURS = 5.5;

/** Start hour for demonstration sessions (6:00 AM IST) */
const ACTIVE_START_HOUR_IST = 6;

/** End hour for demonstration sessions (2:00 AM IST = hour 2) */
const ACTIVE_END_HOUR_IST = 2;

/** Heartbeat/update interval in milliseconds (30 seconds) */
const UPDATE_INTERVAL_MS = 30 * 1000;

/** How often sessions change (in minutes) - each account changes at different intervals */
const SESSION_CHANGE_INTERVALS = [30, 45, 60, 90, 120, 150, 180, 210, 240]; // 30min to 4hr

// =====================================================
// DEMONSTRATION_ACCOUNT: Seeded Random Number Generator
// =====================================================

/**
 * Seeded pseudo-random number generator (Mulberry32)
 * Same seed = same sequence of "random" numbers
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  /** Get next random number between 0 and 1 */
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  
  /** Get random integer between min and max (inclusive) */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /** Get random element from array */
  nextElement<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
  
  /** Shuffle array (Fisher-Yates with seed) */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// =====================================================
// DEMONSTRATION_ACCOUNT: Exam & Subject Data
// =====================================================

const DEMONSTRATION_EXAMS = [
  { slug: 'jee-main', name: 'JEE Main', subjects: ['Physics', 'Chemistry', 'Mathematics'] },
  { slug: 'jee-advanced', name: 'JEE Advanced', subjects: ['Physics', 'Chemistry', 'Mathematics'] },
  { slug: 'neet-ug', name: 'NEET UG', subjects: ['Physics', 'Chemistry', 'Biology'] },
  { slug: 'gate', name: 'GATE', subjects: ['Engineering Mathematics', 'General Aptitude', 'Core Subject'] },
  { slug: 'upsc-cse', name: 'UPSC CSE', subjects: ['General Studies', 'CSAT', 'Essay'] },
  { slug: 'cat', name: 'CAT', subjects: ['VARC', 'DILR', 'QA'] },
  { slug: 'ssc-cgl', name: 'SSC CGL', subjects: ['General Intelligence', 'Quantitative Aptitude', 'English'] },
  { slug: 'bank-po', name: 'Bank PO', subjects: ['Reasoning', 'Quantitative Aptitude', 'English'] },
  { slug: 'nda', name: 'NDA', subjects: ['Mathematics', 'General Ability', 'English'] },
  { slug: 'clat', name: 'CLAT', subjects: ['Legal Reasoning', 'English', 'Current Affairs'] },
];

const DEMONSTRATION_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { name: 'Mysore', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
];

// =====================================================
// DEMONSTRATION_ACCOUNT: Type Definitions
// =====================================================

export interface DemonstrationSession {
  id: string;
  exam_slug: string;
  exam_name: string;
  subject: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  avatar_seed: string;
  started_at: string;
  is_demonstration: boolean;
}

// =====================================================
// DEMONSTRATION_ACCOUNT: Time Utilities
// =====================================================

/**
 * Get current time in IST
 */
function getCurrentISTDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  return new Date(utc + (IST_OFFSET_HOURS * 60 * 60 * 1000));
}

/**
 * Get current hour in IST (0-23)
 */
function getCurrentISTHour(): number {
  return getCurrentISTDate().getHours();
}

/**
 * Check if current time is within active hours (6 AM - 2 AM IST)
 */
export function isWithinActiveHours(): boolean {
  const istHour = getCurrentISTHour();
  // Active from 6:00 AM to 2:00 AM next day
  // Hours 6-23 (same day) OR hours 0-1 (next day, before 2 AM)
  return istHour >= ACTIVE_START_HOUR_IST || istHour < ACTIVE_END_HOUR_IST;
}

/**
 * Get a deterministic seed based on current IST date
 * This ensures all clients generate the same "random" numbers
 */
function getDailySeed(): number {
  const ist = getCurrentISTDate();
  const year = ist.getFullYear();
  const month = ist.getMonth();
  const day = ist.getDate();
  // Combine into a single seed number
  return year * 10000 + month * 100 + day;
}

/**
 * Get a deterministic seed for a specific time slot
 * Accounts change at different intervals, so we need a slot-based seed
 */
function getSlotSeed(accountIndex: number, intervalMinutes: number): number {
  const ist = getCurrentISTDate();
  const totalMinutes = ist.getHours() * 60 + ist.getMinutes();
  const slot = Math.floor(totalMinutes / intervalMinutes);
  return getDailySeed() * 1000 + accountIndex * 100 + slot;
}

// =====================================================
// DEMONSTRATION_ACCOUNT: Session Generation
// =====================================================

/**
 * Generate deterministic demonstration sessions
 * All clients will generate the same sessions at the same time
 */
function generateDeterministicSessions(): DemonstrationSession[] {
  if (!isWithinActiveHours()) {
    console.log('[DemonstrationAccounts] Outside active hours, no sessions');
    return [];
  }
  
  const dailySeed = getDailySeed();
  const dailyRng = new SeededRandom(dailySeed);
  
  // Determine number of accounts for today (5-15, consistent all day)
  const accountCount = dailyRng.nextInt(5, 15);
  
  // Shuffle cities for today (same order all day)
  const shuffledCities = dailyRng.shuffle(DEMONSTRATION_CITIES);
  
  const sessions: DemonstrationSession[] = [];
  
  for (let i = 0; i < accountCount; i++) {
    // Each account has a different change interval
    const intervalMinutes = SESSION_CHANGE_INTERVALS[i % SESSION_CHANGE_INTERVALS.length];
    
    // Get slot-based seed for this account's current session
    const slotSeed = getSlotSeed(i, intervalMinutes);
    const slotRng = new SeededRandom(slotSeed);
    
    // Select city (from shuffled list, with wraparound)
    const city = shuffledCities[i % shuffledCities.length];
    
    // Select exam and subject based on slot
    const exam = slotRng.nextElement(DEMONSTRATION_EXAMS);
    const subject = slotRng.nextElement(exam.subjects);
    
    // Add small deterministic jitter to coordinates
    const latJitter = (slotRng.next() - 0.5) * 0.08;
    const lngJitter = (slotRng.next() - 0.5) * 0.08;
    
    // Calculate when this slot started (for started_at)
    const ist = getCurrentISTDate();
    const totalMinutes = ist.getHours() * 60 + ist.getMinutes();
    const slotStart = Math.floor(totalMinutes / intervalMinutes) * intervalMinutes;
    const slotStartDate = new Date(ist);
    slotStartDate.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0);
    
    sessions.push({
      id: `demo-${dailySeed}-${i}`,
      exam_slug: exam.slug,
      exam_name: exam.name,
      subject: subject,
      latitude: city.lat + latJitter,
      longitude: city.lng + lngJitter,
      city: city.name,
      state: city.state,
      avatar_seed: `demo-avatar-${dailySeed}-${i}`,
      started_at: slotStartDate.toISOString(),
      is_demonstration: true,
    });
  }
  
  console.log(`[DemonstrationAccounts] Generated ${sessions.length} sessions for seed ${dailySeed}`);
  return sessions;
}

// =====================================================
// DEMONSTRATION_ACCOUNT: Service Class
// =====================================================

class DemonstrationAccountService {
  private isRunning: boolean = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private sessionListeners: Set<(sessions: DemonstrationSession[]) => void> = new Set();
  private cachedSessions: DemonstrationSession[] = [];

  start(): void {
    if (this.isRunning) {
      console.log('[DemonstrationAccounts] Service already running');
      return;
    }

    console.log('[DemonstrationAccounts] Starting deterministic service...');
    this.isRunning = true;

    // Generate initial sessions
    this.updateSessions();

    // Update every 30 seconds to catch slot changes
    this.updateInterval = setInterval(() => {
      this.updateSessions();
    }, UPDATE_INTERVAL_MS);
  }

  stop(): void {
    if (!this.isRunning) return;

    console.log('[DemonstrationAccounts] Stopping service...');
    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.cachedSessions = [];
    this.notifyListeners();
  }

  private updateSessions(): void {
    const newSessions = generateDeterministicSessions();
    
    // Only notify if sessions changed
    const sessionsChanged = JSON.stringify(newSessions) !== JSON.stringify(this.cachedSessions);
    
    if (sessionsChanged) {
      this.cachedSessions = newSessions;
      console.log(`[DemonstrationAccounts] Updated: ${newSessions.length} accounts active`);
      this.notifyListeners();
    }
  }

  getActiveSessions(): DemonstrationSession[] {
    return this.cachedSessions;
  }

  subscribe(callback: (sessions: DemonstrationSession[]) => void): () => void {
    this.sessionListeners.add(callback);
    
    // Immediately send current state
    callback(this.getActiveSessions());

    return () => {
      this.sessionListeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const sessions = this.getActiveSessions();
    this.sessionListeners.forEach(callback => {
      try {
        callback(sessions);
      } catch (err) {
        console.error('[DemonstrationAccounts] Listener error:', err);
      }
    });
  }

  getStatus(): {
    isRunning: boolean;
    isActiveHours: boolean;
    activeAccounts: number;
    currentISTHour: number;
  } {
    return {
      isRunning: this.isRunning,
      isActiveHours: isWithinActiveHours(),
      activeAccounts: this.cachedSessions.length,
      currentISTHour: getCurrentISTHour(),
    };
  }
}

// =====================================================
// DEMONSTRATION_ACCOUNT: Singleton & Exports
// =====================================================

let serviceInstance: DemonstrationAccountService | null = null;

export function getDemonstrationAccountService(): DemonstrationAccountService {
  if (!serviceInstance) {
    serviceInstance = new DemonstrationAccountService();
  }
  return serviceInstance;
}

export function initializeDemonstrationAccounts(): void {
  const service = getDemonstrationAccountService();
  service.start();
}

export function stopDemonstrationAccounts(): void {
  if (serviceInstance) {
    serviceInstance.stop();
  }
}

export function getDemonstrationSessions(): DemonstrationSession[] {
  if (!serviceInstance) {
    return [];
  }
  return serviceInstance.getActiveSessions();
}

export function subscribeToDemonstrationSessions(
  callback: (sessions: DemonstrationSession[]) => void
): () => void {
  const service = getDemonstrationAccountService();
  return service.subscribe(callback);
}

export function areDemonstrationAccountsActive(): boolean {
  if (!serviceInstance) return false;
  const status = serviceInstance.getStatus();
  return status.isRunning && status.isActiveHours && status.activeAccounts > 0;
}
