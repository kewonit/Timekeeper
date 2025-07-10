# Timekeeper Data Architecture

## Overview

The Timekeeper project has been refactored to use a **split data architecture** that separates exam session data from exam metadata. This design makes it highly scalable for managing thousands of exams while keeping the codebase maintainable.

## Architecture Components

### 1. **exam-sessions.json** - Session & Date Management
```json
{
  "sessions": [
    {
      "id": "jee-main-2026",
      "sessions": [
        {
          "session": "Session 1",
          "date": "2026-01-24"
        },
        {
          "session": "Session 2", 
          "date": "2026-04-08"
        }
      ]
    }
  ]
}
```

**Purpose**: Lightweight file containing only exam IDs and their session dates. This is the file you'll update most frequently when exam dates change.

### 2. **exam-metadata.json** - Detailed Exam Information
```json
{
  "metadata": {
    "jee-main-2026": {
      "name": "JEE Main",
      "fullName": "Joint Entrance Examination Main",
      "description": "National level engineering entrance exam...",
      "category": "Engineering",
      "eligibility": "12th pass with PCM",
      "subjects": ["Physics", "Chemistry", "Mathematics"],
      "duration": "3 hours",
      "conductingBody": "NTA",
      "seats": "1,50,000+",
      "officialWebsite": "https://jeemain.nta.nic.in/",
      "relatedExams": ["jee-advanced", "bitsat"],
      "slug": "jee-main",
      "metaDescription": "JEE Main 2026 countdown timer...",
      "keywords": ["JEE Main 2026", "JEE preparation"]
    }
  }
}
```

**Purpose**: Rich metadata that rarely changes. Contains all the detailed information about each exam.

### 3. **exam-data.ts** - Smart Data Layer
The main TypeScript file that intelligently combines both JSON files with:

- **In-memory caching** for optimal performance
- **O(1) lookups** using Maps
- **Session-aware time calculations**
- **Smart related exam suggestions**
- **Search and filtering capabilities**

### 4. **data-management.ts** - Development Utilities
Helper functions for:
- Validating exam data
- Creating new exams
- Bulk operations
- Quick templates for common exam types

### 5. **exams.ts** - Backward Compatibility Layer
Maintains compatibility with existing code while using the new architecture.

## Key Benefits

### 🚀 **Scalability**
- **Lightweight session updates**: Only update dates when needed
- **Efficient memory usage**: Smart caching prevents redundant data processing
- **Fast lookups**: O(1) access to exam data using Maps

### 🔧 **Maintainability**
- **Separation of concerns**: Sessions vs metadata
- **Easy bulk operations**: Add 100s of exams quickly
- **Validation built-in**: Prevents data corruption

### ⚡ **Performance**
- **Lazy loading**: Data is only processed when needed
- **Caching layer**: Repeated calls use cached data
- **Optimized searches**: Smart filtering and searching

### 🔄 **Backward Compatibility**
- **Existing code works**: No breaking changes
- **Gradual migration**: Use new features when ready
- **Type safety**: Full TypeScript support

## Usage Examples

### Basic Usage (Same as before)
```typescript
import { indianExams, getExamBySlug } from './data/exams';

const jeeMain = getExamBySlug('jee-main');
console.log(jeeMain?.name); // "JEE Main"
```

### Enhanced Features
```typescript
import { 
  getExamData, 
  searchExams, 
  getUpcomingExams,
  calculateTimeRemaining 
} from './data/exam-data';

// Get all exam data
const allExams = getExamData();

// Search exams
const engineeringExams = searchExams('engineering');

// Get upcoming exams in next 30 days
const upcomingExams = getUpcomingExams(30);

// Enhanced time calculation with session awareness
const jeeMain = getExamBySlug('jee-main');
if (jeeMain) {
  const timeData = calculateTimeRemaining(jeeMain);
  console.log(timeData.nextSession); // Next upcoming session
  console.log(timeData.allSessions); // All sessions with timing
}
```

## Adding New Exams

### Method 1: Using the Helper Script
```bash
node src/data/add-exam.js "NEET SS" "National Eligibility cum Entrance Test - Super Specialty" "2026-06-15" "Medical" "NBE"
```

### Method 2: Using Data Management Utilities
```typescript
import { createExamTemplate, logExamDataForFiles } from './data/data-management';

const newExam = createExamTemplate(
  'GATE CSE',
  'Graduate Aptitude Test in Computer Science',
  'Engineering',
  'IIT Delhi',
  '2026-02-15',
  {
    subjects: ['Computer Science', 'Mathematics'],
    eligibility: 'B.Tech in Computer Science',
    duration: '3 hours'
  }
);

logExamDataForFiles(newExam);
```

### Method 3: Quick Templates
```typescript
import { QUICK_TEMPLATES } from './data/data-management';

// Engineering exam template
const newEngExam = QUICK_TEMPLATES.engineering(
  'KCET CSE', 
  'Karnataka CET Computer Science', 
  '2026-04-20', 
  'KEA'
);

// Medical exam template
const newMedExam = QUICK_TEMPLATES.medical(
  'NEET SS', 
  'NEET Super Specialty', 
  '2026-06-15', 
  'NBE'
);
```

## File Structure
```
src/data/
├── exam-sessions.json      # Session dates (frequently updated)
├── exam-metadata.json      # Detailed exam info (rarely updated)
├── exam-data.ts           # Smart data layer with caching
├── data-management.ts     # Development utilities
├── exams.ts              # Backward compatibility layer
├── add-exam.js           # Quick exam addition script
└── exams.json            # Original file (can be deprecated)
```

## Migration Guide

### For Existing Code
No changes needed! The `exams.ts` file maintains full backward compatibility.

### For New Features
Use the enhanced functions from `exam-data.ts`:
- `getExamData()` instead of `indianExams`
- `calculateTimeRemaining(exam)` for session-aware timing
- `searchExams()` for advanced searching
- `getUpcomingExams()` for date-based filtering

## Performance Considerations

### Caching Strategy
- Data is cached in memory after first access
- Use `clearCache()` if you need to refresh data
- Lookups use Maps for O(1) access time

### Memory Usage
- Sessions: ~50KB for 1000 exams
- Metadata: ~500KB for 1000 exams
- Combined: Efficient memory usage with smart caching

## Best Practices

### 1. **Updating Dates**
Only modify `exam-sessions.json` when exam dates change.

### 2. **Adding New Exams**
Use the helper utilities to ensure data consistency.

### 3. **Bulk Operations**
Use `createMultipleExams()` for adding many exams at once.

### 4. **Performance**
Cache data at the application level if making many repeated calls.

## Future Enhancements

### Planned Features
- [ ] **Database integration**: PostgreSQL/MongoDB support
- [ ] **Real-time updates**: WebSocket integration
- [ ] **Admin dashboard**: GUI for managing exams
- [ ] **API endpoints**: RESTful API for external access
- [ ] **Export utilities**: CSV/Excel export capabilities

### Extensibility
The architecture is designed to easily support:
- Multiple years (2026, 2027, etc.)
- International exams
- Custom exam categories
- Multi-language support
- Advanced filtering options

## Support

For questions or issues with the new architecture:
1. Check the validation utilities in `data-management.ts`
2. Use the helper script `add-exam.js` for quick additions
3. Review the examples in this README
4. The backward compatibility layer ensures existing code continues to work

---

**Note**: The original `exams.json` file is now deprecated but maintained for reference. All new development should use the split architecture for better scalability and maintainability.
