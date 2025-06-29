import examData from './exams.json';

// Export the exam data from JSON for consistency
export const indianExams = examData.exams;

// Type definitions for better TypeScript support
export interface ExamSession {
    session: string;
    date: string;
}

export interface ExamData {
    id: string;
    name: string;
    fullName: string;
    sessions: ExamSession[];
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

// SEO utility functions
export function generateExamPageTitle(exam: ExamData, timeLeft?: any): string {
    if (timeLeft && !timeLeft.expired) {
        const timeString = timeLeft.days > 0 ?
            `${timeLeft.days} Days ${timeLeft.hours}h Left` :
            `${timeLeft.hours}h ${timeLeft.minutes}m Left`;
        return `${exam.name} Countdown Timer - ${timeString} | ${exam.fullName} 2026`;
    }
    return `${exam.name} 2026 Countdown Timer | ${exam.fullName} Exam Date - TimeKeeper`;
}

export function generateExamMetaDescription(exam: ExamData, timeLeft?: any): string {
    const baseDescription = exam.metaDescription;
    if (timeLeft && !timeLeft.expired) {
        const timeString = `${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes remaining`;
        return `${exam.fullName} countdown timer - ${timeString}. Track exact time until ${exam.name} 2026 exam. Real-time countdown with precision timing.`;
    }
    return baseDescription;
}

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
    indianExams.forEach(exam => {
        exam.keywords.forEach(keyword => allKeywords.add(keyword));
        allKeywords.add(`${exam.name} countdown`);
        allKeywords.add(`${exam.name} timer`);
        allKeywords.add(`${exam.name} 2026`);
        allKeywords.add(`${exam.name} exam date`);
        allKeywords.add(`time left for ${exam.name}`);
    });

    return Array.from(allKeywords);
}

export function getExamsByCategory(category: string): ExamData[] {
    return indianExams.filter(exam =>
        exam.category.toLowerCase() === category.toLowerCase()
    );
}

export function getRelatedExams(examSlug: string, limit: number = 4): ExamData[] {
    const exam = indianExams.find(e => e.slug === examSlug);
    if (!exam) return [];

    return exam.relatedExams
        .map(slug => indianExams.find(e => e.slug === slug))
        .filter(Boolean)
        .slice(0, limit) as ExamData[];
}

export function calculateTimeRemaining(targetDate: string) {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
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

// Export all categories for dynamic page generation
export function getAllCategories(): string[] {
    return [...new Set(indianExams.map(exam => exam.category))];
}

// Export conducting bodies for filtering
export function getAllConductingBodies(): string[] {
    return [...new Set(indianExams.map(exam => exam.conductingBody))];
}

// Legacy function for backward compatibility
export function getExamBySlug(slug: string): ExamData | undefined {
    return indianExams.find(exam => exam.slug === slug);
}
