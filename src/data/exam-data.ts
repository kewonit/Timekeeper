import sessionsData from './exam-sessions.json';
import metadataData from './exam-metadata.json';

// Enhanced type definitions
export interface ExamSession {
    session: string;
    date: string;
    endDate?: string;
    note?: string;
    predicted?: boolean;
}

export interface ExamMetadata {
    name: string;
    fullName: string;
    description: string;
    category: string;
    eligibility: string;
    subjects: string[];
    duration: string;
    conductingBody: string;
    seats: string;
    officialWebsite?: string;
    relatedExams: string[];
    slug: string;
    metaDescription: string;
    keywords: string[];
}

export interface ExamData extends ExamMetadata {
    id: string;
    sessions: ExamSession[];
}

// In-memory cache for performance
let examDataCache: ExamData[] | null = null;
let metadataLookup: Map<string, ExamMetadata> | null = null;
let sessionsLookup: Map<string, ExamSession[]> | null = null;

/**
 * Initialize lookup maps for O(1) access
 */
function initializeLookups(): void {
    if (metadataLookup && sessionsLookup) return;

    metadataLookup = new Map();
    sessionsLookup = new Map();

    // Build metadata lookup
    Object.entries(metadataData.metadata).forEach(([id, metadata]) => {
        metadataLookup!.set(id, metadata);
    });

    // Build sessions lookup
    sessionsData.sessions.forEach(({ id, sessions }) => {
        sessionsLookup!.set(id, sessions);
    });
}

function getSessionStartTime(session: ExamSession): number {
    return new Date(session.date).getTime();
}

function getSessionEndTime(session: ExamSession): number {
    return new Date(session.endDate || session.date).getTime();
}

function shiftISODate(date: string, years: number): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year + years, month - 1, day)).toISOString().split('T')[0];
}

function predictFutureSessions(sessions: ExamSession[], now: number): ExamSession[] {
    for (let yearsToAdvance = 1; yearsToAdvance <= 5; yearsToAdvance++) {
        const predictedSessions = sessions.map(session => ({
            ...session,
            date: shiftISODate(session.date, yearsToAdvance),
            endDate: session.endDate ? shiftISODate(session.endDate, yearsToAdvance) : undefined,
            predicted: true,
            note: session.note
                ? `${session.note} (predicted next cycle from the latest published schedule)`
                : 'Predicted next cycle from the latest published schedule'
        }));

        if (predictedSessions.some(session => getSessionEndTime(session) >= now)) {
            return predictedSessions;
        }
    }

    return sessions;
}

function normalizeSessionsForDisplay(sessions: ExamSession[]): ExamSession[] {
    if (sessions.length === 0) return [];

    const now = Date.now();
    const sortedSessions = [...sessions].sort((a, b) => getSessionStartTime(a) - getSessionStartTime(b));
    const upcomingOrOngoingSessions = sortedSessions.filter(session => getSessionEndTime(session) >= now);

    if (upcomingOrOngoingSessions.length > 0) {
        return upcomingOrOngoingSessions;
    }

    return predictFutureSessions(sortedSessions, now);
}

/**
 * Get combined exam data with intelligent caching
 */
export function getExamData(): ExamData[] {
    if (examDataCache) return examDataCache;

    initializeLookups();
    examDataCache = [];

    // Combine data efficiently
    metadataLookup!.forEach((metadata, id) => {
        const sessions = sessionsLookup!.get(id) || [];
        examDataCache!.push({
            id,
            ...metadata,
            sessions: normalizeSessionsForDisplay(sessions)
        });
    });

    return examDataCache;
}

/**
 * Get single exam by ID with O(1) lookup
 */
export function getExamById(id: string): ExamData | undefined {
    initializeLookups();

    const metadata = metadataLookup!.get(id);
    if (!metadata) return undefined;

    const sessions = normalizeSessionsForDisplay(sessionsLookup!.get(id) || []);
    return {
        id,
        ...metadata,
        sessions
    };
}

/**
 * Get exam by slug with optimized search
 */
export function getExamBySlug(slug: string): ExamData | undefined {
    return getExamData().find(exam => exam.slug === slug);
}

/**
 * Get exams by category with caching
 */
export function getExamsByCategory(category: string): ExamData[] {
    return getExamData().filter(exam =>
        exam.category.toLowerCase() === category.toLowerCase()
    );
}

/**
 * Get related exams with smart fallback
 */
export function getRelatedExams(examSlug: string, limit: number = 4): ExamData[] {
    const exam = getExamBySlug(examSlug);
    if (!exam) return [];

    const relatedExams = exam.relatedExams
        .map(slug => getExamBySlug(slug))
        .filter(Boolean)
        .slice(0, limit) as ExamData[];

    // Smart fallback: if not enough related exams, add from same category
    if (relatedExams.length < limit) {
        const categoryExams = getExamsByCategory(exam.category)
            .filter(e => e.slug !== examSlug && !exam.relatedExams.includes(e.slug))
            .slice(0, limit - relatedExams.length);

        relatedExams.push(...categoryExams);
    }

    return relatedExams;
}

/**
 * Enhanced time calculation with session-aware logic
 */
export function calculateTimeRemaining(exam: ExamData): {
    nextSession: ExamSession | null;
    timeRemaining: {
        expired: boolean;
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    };
    allSessions: Array<{
        session: ExamSession;
        timeRemaining: {
            expired: boolean;
            days: number;
            hours: number;
            minutes: number;
            seconds: number;
        };
    }>;
} {
    const now = new Date().getTime();

    // Calculate time for all sessions
    const allSessions = exam.sessions.map(session => ({
        session,
        timeRemaining: calculateSingleTime(session.date, now, session.endDate)
    }));

    // Find next upcoming session
    const upcomingSessions = allSessions.filter(s => !s.timeRemaining.expired);
    const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

    return {
        nextSession: nextSession?.session || null,
        timeRemaining: nextSession?.timeRemaining || { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 },
        allSessions
    };
}

/**
 * Calculate time for a single date
 */
function calculateSingleTime(targetDate: string, now: number, endDate?: string) {
    const start = new Date(targetDate).getTime();
    const end = new Date(endDate || targetDate).getTime();
    const target = now < start ? start : end;
    const distance = target - now;

    if (distance < 0) {
        return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    return { expired: false, days, hours, minutes, seconds };
}

/**
 * Enhanced SEO functions with session awareness
 */
export function generateExamPageTitle(exam: ExamData): string {
    const timeData = calculateTimeRemaining(exam);
    const sessionYear = new Date(timeData.nextSession?.date || exam.sessions[0]?.date || Date.now()).getFullYear();

    if (timeData.nextSession && !timeData.timeRemaining.expired) {
        const { days, hours } = timeData.timeRemaining;
        const timeString = days > 0 ? `${days} Days ${hours}h Left` : `${hours}h Left`;
        const sessionInfo = exam.sessions.length > 1 ? ` (${timeData.nextSession.session})` : '';
        return `${exam.name} Countdown Timer - ${timeString}${sessionInfo} | ${exam.fullName} ${sessionYear}`;
    }

    return `${exam.name} ${sessionYear} Countdown Timer | ${exam.fullName} Exam Date - TimeKeeper`;
}

export function generateExamMetaDescription(exam: ExamData): string {
    const timeData = calculateTimeRemaining(exam);
    const sessionYear = new Date(timeData.nextSession?.date || exam.sessions[0]?.date || Date.now()).getFullYear();

    if (timeData.nextSession && !timeData.timeRemaining.expired) {
        const { days, hours, minutes } = timeData.timeRemaining;
        const timeString = `${days} days, ${hours} hours, ${minutes} minutes remaining`;
        const sessionInfo = exam.sessions.length > 1 ? ` for ${timeData.nextSession.session}` : '';
        return `${exam.fullName} countdown timer - ${timeString}${sessionInfo}. Track exact time until ${exam.name} ${sessionYear} exam. Real-time countdown with precision timing.`;
    }

    return exam.metaDescription;
}

/**
 * Get all unique keywords with intelligent combination
 */
export function getAllExamKeywords(): string[] {
    const allKeywords = new Set<string>();

    // Base countdown and timer keywords
    const baseKeywords = [
        'countdown timer', 'exam countdown', 'time keeper', 'timer app', 'exam timer',
        'countdown clock', 'time tracker', 'exam date countdown', 'real time countdown',
        'online timer', 'exam countdown app', 'competitive exam timer', 'entrance exam countdown',
        'exam preparation timer', 'study timer', 'countdown widget', 'exam schedule tracker',
        'time remaining calculator', 'exam day countdown', 'digital countdown timer',
        'indian exams 2026', 'indian competitive exams', 'indian entrance exams',
        'india exam countdown', 'nta exams', 'indian exam dates', 'competitive exam india',
        'entrance exam india', 'indian exam calendar', 'exam countdown india'
    ];

    baseKeywords.forEach(keyword => allKeywords.add(keyword));

    // Add exam-specific keywords
    getExamData().forEach(exam => {
        exam.keywords.forEach(keyword => allKeywords.add(keyword));
        allKeywords.add(`${exam.name} countdown`);
        allKeywords.add(`${exam.name} timer`);
        allKeywords.add(`${exam.name} 2026`);
        allKeywords.add(`${exam.name} exam date`);
        allKeywords.add(`time left for ${exam.name}`);
    });

    return Array.from(allKeywords);
}

/**
 * Get all categories with caching
 */
export function getAllCategories(): string[] {
    return [...new Set(getExamData().map(exam => exam.category))];
}

/**
 * Get all conducting bodies
 */
export function getAllConductingBodies(): string[] {
    return [...new Set(getExamData().map(exam => exam.conductingBody))];
}

/**
 * Get exams by conducting body
 */
export function getExamsByConductingBody(body: string): ExamData[] {
    return getExamData().filter(exam =>
        exam.conductingBody.toLowerCase() === body.toLowerCase()
    );
}

/**
 * Search exams by name, category, or keyword
 */
export function searchExams(query: string): ExamData[] {
    const searchTerm = query.toLowerCase();
    return getExamData().filter(exam =>
        exam.name.toLowerCase().includes(searchTerm) ||
        exam.fullName.toLowerCase().includes(searchTerm) ||
        exam.category.toLowerCase().includes(searchTerm) ||
        exam.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
}

/**
 * Get upcoming exams within a date range
 */
export function getUpcomingExams(days: number = 30): ExamData[] {
    const now = new Date().getTime();
    const futureTime = now + (days * 24 * 60 * 60 * 1000);

    return getExamData().filter(exam => {
        const timeData = calculateTimeRemaining(exam);
        if (!timeData.nextSession) return false;

        const sessionTime = new Date(timeData.nextSession.date).getTime();
        return sessionTime > now && sessionTime <= futureTime;
    });
}

/**
 * Get exam statistics
 */
export function getExamStatistics() {
    const exams = getExamData();
    const categories = getAllCategories();
    const bodies = getAllConductingBodies();

    const totalSessions = exams.reduce((sum, exam) => sum + exam.sessions.length, 0);
    const upcomingExams = getUpcomingExams().length;

    return {
        totalExams: exams.length,
        totalSessions,
        upcomingExams,
        categories: categories.length,
        conductingBodies: bodies.length,
        categoriesBreakdown: categories.map(cat => ({
            category: cat,
            count: getExamsByCategory(cat).length
        }))
    };
}

/**
 * Clear cache (useful for dynamic updates)
 */
export function clearCache(): void {
    examDataCache = null;
    metadataLookup = null;
    sessionsLookup = null;
}

// Legacy exports for backward compatibility
export { getExamData as indianExams };

// Export raw data for special use cases
export const rawSessions = sessionsData.sessions;
export const rawMetadata = metadataData.metadata;
