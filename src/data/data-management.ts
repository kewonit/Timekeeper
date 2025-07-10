/**
 * Data Management Utilities for Timekeeper
 * 
 * This utility helps manage exam data across the two JSON files:
 * - exam-sessions.json: Contains exam IDs and session dates
 * - exam-metadata.json: Contains detailed exam information
 */

import type { ExamSession, ExamMetadata } from './exam-data';

// Types for data management
export interface NewExamData {
    id: string;
    sessions: ExamSession[];
    metadata: ExamMetadata;
}

export interface ExamSessionUpdate {
    id: string;
    sessions: ExamSession[];
}

export interface ExamMetadataUpdate {
    id: string;
    metadata: Partial<ExamMetadata>;
}

/**
 * Validation utilities
 */
export function validateExamId(id: string): boolean {
    return /^[a-z0-9-]+$/.test(id) && id.length >= 3;
}

export function validateExamSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2;
}

export function validateDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

export function validateExamSession(session: ExamSession): string[] {
    const errors: string[] = [];

    if (!session.session || session.session.trim().length === 0) {
        errors.push('Session name cannot be empty');
    }

    if (!validateDate(session.date)) {
        errors.push('Invalid date format. Use YYYY-MM-DD');
    }

    return errors;
}

export function validateExamMetadata(metadata: ExamMetadata): string[] {
    const errors: string[] = [];

    if (!metadata.name || metadata.name.trim().length === 0) {
        errors.push('Exam name cannot be empty');
    }

    if (!metadata.fullName || metadata.fullName.trim().length === 0) {
        errors.push('Full name cannot be empty');
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
        errors.push('Description cannot be empty');
    }

    if (!metadata.category || metadata.category.trim().length === 0) {
        errors.push('Category cannot be empty');
    }

    if (!metadata.eligibility || metadata.eligibility.trim().length === 0) {
        errors.push('Eligibility cannot be empty');
    }

    if (!metadata.conductingBody || metadata.conductingBody.trim().length === 0) {
        errors.push('Conducting body cannot be empty');
    }

    if (!validateExamSlug(metadata.slug)) {
        errors.push('Invalid slug format. Use lowercase letters, numbers, and hyphens only');
    }

    if (!metadata.subjects || metadata.subjects.length === 0) {
        errors.push('At least one subject is required');
    }

    if (!metadata.keywords || metadata.keywords.length === 0) {
        errors.push('At least one keyword is required');
    }

    return errors;
}

/**
 * Helper functions for creating exam data
 */
export function createExamId(examName: string, year: string = '2026'): string {
    return `${examName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${year}`;
}

export function createExamSlug(examName: string): string {
    return examName.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

export function generateBasicKeywords(examName: string, category: string): string[] {
    const baseKeywords = [
        `${examName} 2026`,
        `${examName} countdown`,
        `${examName} exam date`,
        `${examName} preparation`,
        `${category.toLowerCase()} entrance exam`
    ];

    return baseKeywords;
}

/**
 * Template for creating new exam data
 */
export function createExamTemplate(
    name: string,
    fullName: string,
    category: string,
    conductingBody: string,
    examDate: string,
    options: {
        sessions?: ExamSession[];
        description?: string;
        eligibility?: string;
        subjects?: string[];
        duration?: string;
        seats?: string;
        officialWebsite?: string;
        relatedExams?: string[];
        additionalKeywords?: string[];
    } = {}
): NewExamData {
    const id = createExamId(name);
    const slug = createExamSlug(name);

    const defaultSessions: ExamSession[] = options.sessions || [
        {
            session: 'Single Session',
            date: examDate
        }
    ];

    const defaultKeywords = generateBasicKeywords(name, category);
    const allKeywords = [...defaultKeywords, ...(options.additionalKeywords || [])];

    return {
        id,
        sessions: defaultSessions,
        metadata: {
            name,
            fullName,
            description: options.description || `${fullName} - ${category} entrance examination`,
            category,
            eligibility: options.eligibility || 'As per official notification',
            subjects: options.subjects || ['General'],
            duration: options.duration || '3 hours',
            conductingBody,
            seats: options.seats || 'Variable',
            officialWebsite: options.officialWebsite,
            relatedExams: options.relatedExams || [],
            slug,
            metaDescription: `${name} 2026 countdown timer. Track days until ${fullName}. Complete exam guide and preparation tips.`,
            keywords: allKeywords
        }
    };
}

/**
 * Data formatting utilities
 */
export function formatSessionsForJSON(sessions: ExamSession[]): string {
    return JSON.stringify(sessions, null, 2);
}

export function formatMetadataForJSON(metadata: ExamMetadata): string {
    return JSON.stringify(metadata, null, 2);
}

/**
 * Bulk operations helpers
 */
export function createMultipleExams(examDefinitions: Array<{
    name: string;
    fullName: string;
    category: string;
    conductingBody: string;
    examDate: string;
    options?: {
        sessions?: ExamSession[];
        description?: string;
        eligibility?: string;
        subjects?: string[];
        duration?: string;
        seats?: string;
        officialWebsite?: string;
        relatedExams?: string[];
        additionalKeywords?: string[];
    };
}>): NewExamData[] {
    return examDefinitions.map(def =>
        createExamTemplate(def.name, def.fullName, def.category, def.conductingBody, def.examDate, def.options || {})
    );
}

/**
 * Common exam categories and conducting bodies
 */
export const EXAM_CATEGORIES = [
    'Engineering',
    'Medical',
    'Management',
    'Civil Services',
    'Banking',
    'Railway',
    'Teaching',
    'Law',
    'Government Jobs',
    'Defense',
    'Commerce',
    'Science',
    'Arts'
] as const;

export const COMMON_CONDUCTING_BODIES = [
    'NTA',
    'UPSC',
    'SSC',
    'IBPS',
    'SBI',
    'RRB',
    'UGC',
    'CSIR',
    'IIT',
    'IISc',
    'AIIMS',
    'CBSE',
    'State Government'
] as const;

export type ExamCategory = typeof EXAM_CATEGORIES[number];
export type ConductingBody = typeof COMMON_CONDUCTING_BODIES[number];

/**
 * Example usage and quick start templates
 */
export const QUICK_TEMPLATES = {
    engineering: (name: string, fullName: string, date: string, conductingBody: string) =>
        createExamTemplate(name, fullName, 'Engineering', conductingBody, date, {
            subjects: ['Physics', 'Chemistry', 'Mathematics'],
            eligibility: '12th pass with PCM',
            duration: '3 hours'
        }),

    medical: (name: string, fullName: string, date: string, conductingBody: string) =>
        createExamTemplate(name, fullName, 'Medical', conductingBody, date, {
            subjects: ['Physics', 'Chemistry', 'Biology'],
            eligibility: '12th pass with PCB',
            duration: '3 hours'
        }),

    management: (name: string, fullName: string, date: string, conductingBody: string) =>
        createExamTemplate(name, fullName, 'Management', conductingBody, date, {
            subjects: ['Quantitative Ability', 'Verbal Ability', 'Logical Reasoning'],
            eligibility: "Bachelor's degree",
            duration: '3 hours'
        }),

    banking: (name: string, fullName: string, date: string, conductingBody: string) =>
        createExamTemplate(name, fullName, 'Banking', conductingBody, date, {
            subjects: ['English', 'Reasoning', 'Quantitative Aptitude', 'General Awareness'],
            eligibility: "Bachelor's degree",
            duration: 'Multi-phase exam'
        })
};

/**
 * Export for easy scripting
 */
export function logExamDataForFiles(examData: NewExamData): void {
    console.log('=== SESSION DATA ===');
    console.log(`Add this to exam-sessions.json:`);
    console.log(JSON.stringify({
        id: examData.id,
        sessions: examData.sessions
    }, null, 2));

    console.log('\n=== METADATA ===');
    console.log(`Add this to exam-metadata.json:`);
    console.log(`"${examData.id}": ${JSON.stringify(examData.metadata, null, 2)}`);
}
