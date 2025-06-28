export const indianExams = [
    {
        id: 'jee-main-2026',
        name: 'JEE Main',
        fullName: 'Joint Entrance Examination Main',
        date: '2026-01-24',
        description: 'National level engineering entrance exam for admission to NITs, IIITs, and other technical institutes',
        category: 'Engineering',
        difficulty: 'Hard',
        eligibility: '12th pass with PCM',
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        duration: '3 hours',
        conductingBody: 'NTA',
        applicationFee: '₹650-₹3000',
        seats: '1,50,000+',
        relatedExams: ['jee-advanced-2026', 'bitsat-2026', 'wbjee-2026', 'mhtcet-2026'],
        slug: 'jee-main',
        metaDescription: 'JEE Main 2026 countdown timer. Track days, hours, minutes until JEE Main exam. Get exam dates, syllabus, and preparation tips.',
        keywords: ['JEE Main 2026', 'JEE Main countdown', 'JEE Main exam date', 'JEE preparation', 'NTA JEE']
    },
    {
        id: 'jee-advanced-2026',
        name: 'JEE Advanced',
        fullName: 'Joint Entrance Examination Advanced',
        date: '2026-05-17',
        description: 'Premier engineering entrance exam for admission to IITs and ISM Dhanbad',
        category: 'Engineering',
        difficulty: 'Very Hard',
        eligibility: 'JEE Main qualified',
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        duration: '6 hours (2 papers)',
        conductingBody: 'IIT (Rotating)',
        applicationFee: '₹2800',
        seats: '17,000+',
        relatedExams: ['jee-main-2026', 'bitsat-2026', 'kvpy-2026'],
        slug: 'jee-advanced',
        metaDescription: 'JEE Advanced 2026 countdown timer. Track time until IIT JEE Advanced exam. Complete exam schedule and preparation guide.',
        keywords: ['JEE Advanced 2026', 'IIT JEE', 'JEE Advanced countdown', 'IIT admission', 'JEE Advanced exam date']
    },
    {
        id: 'neet-ug-2026',
        name: 'NEET UG',
        fullName: 'National Eligibility cum Entrance Test (Undergraduate)',
        date: '2026-05-03',
        description: 'National medical entrance exam for MBBS, BDS, AYUSH courses',
        category: 'Medical',
        difficulty: 'Hard',
        eligibility: '12th pass with PCB',
        subjects: ['Physics', 'Chemistry', 'Biology'],
        duration: '3 hours 20 minutes',
        conductingBody: 'NTA',
        applicationFee: '₹1600-₹8000',
        seats: '1,08,000+',
        relatedExams: ['neet-pg-2026', 'aiims-2026', 'jipmer-2026'],
        slug: 'neet-ug',
        metaDescription: 'NEET UG 2026 countdown timer. Track days until NEET medical entrance exam. Get exam pattern, syllabus, and prep tips.',
        keywords: ['NEET 2026', 'NEET UG countdown', 'medical entrance exam', 'MBBS admission', 'NEET exam date']
    },
    {
        id: 'bitsat-2026',
        name: 'BITSAT',
        fullName: 'Birla Institute of Technology and Science Admission Test',
        date: '2026-06-15',
        description: 'Computer-based test for admission to BITS Pilani campuses',
        category: 'Engineering',
        difficulty: 'Hard',
        eligibility: '12th pass with PCM',
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Logical Reasoning'],
        duration: '3 hours',
        conductingBody: 'BITS Pilani',
        applicationFee: '₹3400',
        seats: '4,000+',
        relatedExams: ['jee-main-2026', 'viteee-2026', 'comedk-2026'],
        slug: 'bitsat',
        metaDescription: 'BITSAT 2026 countdown timer. Track time until BITS admission test. Complete exam guide and preparation strategy.',
        keywords: ['BITSAT 2026', 'BITS Pilani', 'BITSAT countdown', 'BITSAT exam date', 'BITS admission']
    },
    {
        id: 'cat-2026',
        name: 'CAT',
        fullName: 'Common Admission Test',
        date: '2026-11-29',
        description: 'Premier MBA entrance exam for IIMs and top B-schools',
        category: 'Management',
        difficulty: 'Very Hard',
        eligibility: 'Bachelor\'s degree',
        subjects: ['Verbal Ability', 'Data Interpretation', 'Quantitative Ability'],
        duration: '2 hours',
        conductingBody: 'IIM (Rotating)',
        applicationFee: '₹2300-₹4600',
        seats: '5,000+',
        relatedExams: ['xat-2026', 'snap-2026', 'nmat-2026'],
        slug: 'cat',
        metaDescription: 'CAT 2026 countdown timer. Track days until Common Admission Test. IIM MBA entrance exam dates and preparation guide.',
        keywords: ['CAT 2026', 'CAT countdown', 'IIM admission', 'MBA entrance exam', 'CAT exam date']
    }
    // Add more exams as needed...
];

export function getExamBySlug(slug: string) {
    return indianExams.find(exam => exam.slug === slug);
}

export function getRelatedExams(currentExamSlug: string, category: string) {
    return indianExams
        .filter(exam => exam.slug !== currentExamSlug && exam.category === category)
        .slice(0, 4);
}
