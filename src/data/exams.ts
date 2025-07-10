// Legacy compatibility file - redirects to new architecture
// This file maintains backward compatibility while using the new split architecture

import {
    getExamData,
    getExamById,
    getExamBySlug as getExamBySlugNew,
    getExamsByCategory as getExamsByCategoryNew,
    getRelatedExams as getRelatedExamsNew,
    generateExamPageTitle,
    generateExamMetaDescription,
    getAllExamKeywords as getAllExamKeywordsNew,
    getAllCategories as getAllCategoriesNew,
    getAllConductingBodies as getAllConductingBodiesNew,
    searchExams,
    getUpcomingExams,
    getExamStatistics,
    type ExamData,
    type ExamSession,
    type ExamMetadata
} from './exam-data';

// Export the exam data from the new architecture
export const indianExams = getExamData();

// Re-export types for backward compatibility
export type { ExamSession, ExamData, ExamMetadata };

// Legacy function implementations for backward compatibility
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

// Legacy wrapper functions
export function getExamBySlug(slug: string): ExamData | undefined {
    return getExamBySlugNew(slug);
}

export function getExamsByCategory(category: string): ExamData[] {
    return getExamsByCategoryNew(category);
}

export function getRelatedExams(examSlug: string, limit: number = 4): ExamData[] {
    return getRelatedExamsNew(examSlug, limit);
}

export function getAllExamKeywords(): string[] {
    return getAllExamKeywordsNew();
}

export function getAllCategories(): string[] {
    return getAllCategoriesNew();
}

export function getAllConductingBodies(): string[] {
    return getAllConductingBodiesNew();
}

// Export enhanced functions from new architecture
export {
    getExamData,
    getExamById,
    generateExamPageTitle,
    generateExamMetaDescription,
    searchExams,
    getUpcomingExams,
    getExamStatistics
};