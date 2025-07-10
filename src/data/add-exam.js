#!/usr/bin/env node

/**
 * Quick Exam Addition Script
 * 
 * Usage examples:
 * node add-exam.js "GATE CSE" "Graduate Aptitude Test in Computer Science" "2026-02-15" "Engineering" "IIT Delhi"
 * node add-exam.js "NEET SS" "National Eligibility cum Entrance Test - Super Specialty" "2026-06-15" "Medical" "NBE"
 */

import {
    createExamTemplate,
    logExamDataForFiles,
    validateExamId,
    validateExamSlug,
    validateDate,
    QUICK_TEMPLATES
} from './data-management.js';

function main() {
    const args = process.argv.slice(2);

    if (args.length < 5) {
        console.error('Usage: node add-exam.js <name> <fullName> <date> <category> <conductingBody> [options]');
        console.error('Example: node add-exam.js "GATE CSE" "Graduate Aptitude Test in Computer Science" "2026-02-15" "Engineering" "IIT Delhi"');
        process.exit(1);
    }

    const [name, fullName, date, category, conductingBody] = args;

    // Validate inputs
    if (!validateDate(date)) {
        console.error('Invalid date format. Use YYYY-MM-DD');
        process.exit(1);
    }

    // Create exam data
    const examData = createExamTemplate(name, fullName, category, conductingBody, date);

    // Log the data for manual addition
    logExamDataForFiles(examData);

    console.log('\n=== INSTRUCTIONS ===');
    console.log('1. Copy the SESSION DATA and add it to the "sessions" array in exam-sessions.json');
    console.log('2. Copy the METADATA and add it to the "metadata" object in exam-metadata.json');
    console.log('3. Make sure to add a comma after the previous entry in both JSON files');
    console.log('4. The new exam will be automatically available in your application');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
