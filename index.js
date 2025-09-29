#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP Service for OA-Y Learning Platform
 * 
 * IMPORTANT: Follow the correct creation order for courses, modules, lessons, and tests:
 * 
 * 1. CREATE LESSONS FIRST:
 *    - Use create_lesson to create individual lessons
 *    - Get lesson IDs from the response
 *    - For mixed content type, use contentBlocks array instead of content field
 * 
 * 2. CREATE TESTS (OPTIONAL):
 *    - Use create_test to create tests
 *    - Get test IDs from the response
 * 
 * 3. CREATE MODULES:
 *    - Use create_module with lesson IDs and test IDs
 *    - Get module IDs from the response
 * 
 * 4. CREATE COURSE WITH MODULES:
 *    - Use create_course with module IDs in modules array
 *    - The system automatically generates slug, calculates duration, and sets default values
 * 
 * 5. UPDATE IF NEEDED:
 *    - Use update_* functions for modifications
 *    - Follow the same order: lessons → tests → modules → courses
 * 
 * VALIDATION RULES:
 * - content is required unless contentType === "mixed" and contentBlocks exist
 * - contentBlocks is required when contentType === "mixed"
 * - All entities are created as drafts by default (isDraft: true)
 * - Slug is automatically generated from title with transliteration
 * - Duration is auto-calculated from lessons if not provided
 * - Modules can contain lessons and tests
 * - Courses contain modules with proper ordering
 */

// Validate required environment variables
if (!process.env.APP_ENV) {
  throw new Error('APP_ENV environment variable is required. Set it to "dev" or "prod"');
}

if (!process.env.API_TOKEN) {
  throw new Error('API_TOKEN environment variable is required. Get your token from https://oa-y.com');
}

if (!process.env.API_TOKEN_LIBS) {
  throw new Error('API_TOKEN_LIBS environment variable is required. Get your libs token from https://libs.anyemp.com');
}

const APP_ENV = process.env.APP_ENV;
const API_TOKEN = process.env.API_TOKEN;
const API_TOKEN_LIBS = process.env.API_TOKEN_LIBS;

// Validate APP_ENV value
if (APP_ENV !== 'dev' && APP_ENV !== 'prod') {
  throw new Error(`Invalid APP_ENV value: "${APP_ENV}". Must be "dev" or "prod"`);
}

// API URLs based on environment
const API_BASE_URL = APP_ENV === 'dev' 
  ? 'https://lrn.oa-y.com/api-tokens'
  : 'https://oa-y.com/api-tokens';

const API_BASE_URL_PROFESSIONS = APP_ENV === 'dev'
  ? 'https://libdev.anyemp.com/api/token'
  : 'https://libs.anyemp.com/api/token';

// Headers for API requests
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
});

// Headers for libs API requests
const getLibsHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN_LIBS}`
});

// Tool handlers
const toolHandlers = {
  async get_courses(args) {
    const params = new URLSearchParams();
    if (args.page) params.append('page', args.page.toString());
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.difficulty) params.append('difficulty', args.difficulty);
    if (args.all) params.append('all', 'true');
    
    // Handle professions filter - convert profession IDs to filter array
    if (args.professions && Array.isArray(args.professions)) {
      const professionIds = args.professions.map(p => {
        if (typeof p === 'object' && p._id) {
          return p._id;
        } else if (typeof p === 'number') {
          return p.toString();
        } else if (typeof p === 'string') {
          return p;
        }
        return p;
      });
      if (professionIds.length > 0) {
        params.append('professions', professionIds.join(','));
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/courses?${params}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_course(args) {
    const response = await fetch(`${API_BASE_URL}/courses/${args.courseId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async create_course(args) {
    let professions = args.professions || [];
    professions = professions.map(p => typeof p === 'object' && p._id ? p._id : p);
    
    // Process modules - expect module IDs with order
    const modules = [];
    if (Array.isArray(args.modules)) {
      for (const mod of args.modules) {
        if (!mod.module || typeof mod.module !== 'string') {
          throw new Error('Module ID is required and must be a string. Create modules first using create_module tool.');
        }
        if (typeof mod.order !== 'number') {
          throw new Error('Module order is required and must be a number.');
        }
        modules.push({
          module: mod.module,
          order: mod.order
        });
      }
    }
    
    const courseData = {
      title: args.title,
      description: args.description,
      difficulty: args.difficulty,
      duration: args.duration,
      professions,
      image: args.image,
      isDraft: args.isDraft || false,
      modules,
    };
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(courseData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async update_course(args) {
    let professions = args.professions || [];
    professions = professions.map(p => typeof p === 'object' && p._id ? p._id : p);
    const courseId = args.courseId;
    
    // First, get the current course to preserve existing relationships
    const currentCourseResponse = await fetch(`${API_BASE_URL}/courses/${courseId}`, { headers: getHeaders() });
    if (!currentCourseResponse.ok) throw new Error(`Failed to get current course: HTTP ${currentCourseResponse.status}`);
    const currentCourse = await currentCourseResponse.json();
    
    const courseData = { _id: courseId, ...args, professions };
    delete courseData.courseId;
    
    // If modules not provided, keep existing ones
    if (!courseData.modules && currentCourse.data?.modules) {
      courseData.modules = currentCourse.data.modules.map(module => ({
        module: module.id,
        order: module.order || 1
      }));
    }
    
    // Process modules - expect module IDs with order
    if (Array.isArray(courseData.modules)) {
      for (const mod of courseData.modules) {
        if (!mod.module || typeof mod.module !== 'string') {
          throw new Error('Module ID is required and must be a string. Create modules first using create_module tool.');
        }
        if (typeof mod.order !== 'number') {
          throw new Error('Module order is required and must be a number.');
        }
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(courseData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_lessons(args) {
    const params = new URLSearchParams();
    if (args.page) params.append('page', args.page.toString());
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.type) params.append('type', args.type);
    if (args.contentType) params.append('contentType', args.contentType);
    if (args.courseId) params.append('courseId', args.courseId);
    if (args.moduleId) params.append('moduleId', args.moduleId);
    if (args.sortBy) params.append('sortBy', args.sortBy);
    if (args.all) params.append('all', 'true');
    const response = await fetch(`${API_BASE_URL}/lessons?${params}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_lesson(args) {
    const response = await fetch(`${API_BASE_URL}/lessons/${args.lessonId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async create_lesson(args) {
    const lessonData = { ...args };
    const response = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(lessonData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async update_lesson(args) {
    const lessonId = args.lessonId || args._id;
    if (!lessonId) throw new Error('lessonId is required');
    
    // First, get the current lesson to preserve existing relationships
    const currentLessonResponse = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, { headers: getHeaders() });
    if (!currentLessonResponse.ok) throw new Error(`Failed to get current lesson: HTTP ${currentLessonResponse.status}`);
    const currentLesson = await currentLessonResponse.json();
    
    const lessonData = { ...args };
    delete lessonData.lessonId;
    
    // If module not provided, keep existing one
    if (!lessonData.module && currentLesson.data?.module) {
      lessonData.module = currentLesson.data.module;
    }
    
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(lessonData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_professions(args) {
    const response = await fetch(`${API_BASE_URL_PROFESSIONS}/professions?all=true`, { headers: getLibsHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  // Module handlers
  async get_modules(args) {
    const params = new URLSearchParams();
    if (args.page) params.append('page', args.page);
    if (args.limit) params.append('limit', args.limit);
    if (args.search) params.append('search', args.search);
    const response = await fetch(`${API_BASE_URL}/modules?${params}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_module(args) {
    const response = await fetch(`${API_BASE_URL}/modules/${args.moduleId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async create_module(args) {
    const moduleData = { ...args };
    const response = await fetch(`${API_BASE_URL}/modules`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(moduleData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async update_module(args) {
    const moduleId = args.moduleId || args._id;
    if (!moduleId) throw new Error('moduleId is required');
    
    // First, get the current module to preserve existing relationships
    const currentModuleResponse = await fetch(`${API_BASE_URL}/modules/${moduleId}`, { headers: getHeaders() });
    if (!currentModuleResponse.ok) throw new Error(`Failed to get current module: HTTP ${currentModuleResponse.status}`);
    const currentModule = await currentModuleResponse.json();
    
    // Preserve existing lessons and tests if not provided in update
    const moduleData = { ...args };
    delete moduleData.moduleId;
    
    // If lessons not provided, keep existing ones
    if (!moduleData.lessons && currentModule.data?.lessons) {
      moduleData.lessons = currentModule.data.lessons.map(lesson => lesson.id);
    }
    
    // If tests not provided, keep existing ones
    if (!moduleData.tests && currentModule.data?.tests) {
      moduleData.tests = currentModule.data.tests.map(test => test.id);
    }
    
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(moduleData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  // Test handlers
  async get_tests(args) {
    const params = new URLSearchParams();
    if (args.page) params.append('page', args.page);
    if (args.limit) params.append('limit', args.limit);
    if (args.search) params.append('search', args.search);
    const response = await fetch(`${API_BASE_URL}/tests?${params}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_test(args) {
    const response = await fetch(`${API_BASE_URL}/tests/${args.testId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async create_test(args) {
    const testData = { ...args };
    const response = await fetch(`${API_BASE_URL}/tests`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(testData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async update_test(args) {
    const testId = args.testId || args._id;
    if (!testId) throw new Error('testId is required');
    
    // First, get the current test to preserve existing relationships
    const currentTestResponse = await fetch(`${API_BASE_URL}/tests/${testId}`, { headers: getHeaders() });
    if (!currentTestResponse.ok) throw new Error(`Failed to get current test: HTTP ${currentTestResponse.status}`);
    const currentTest = await currentTestResponse.json();
    
    const testData = { ...args };
    delete testData.testId;
    
    // If module not provided, keep existing one
    if (!testData.module && currentTest.data?.module) {
      testData.module = currentTest.data.module;
    }
    
    const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(testData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
};

// Input Schemas
const getCoursesInputSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', description: 'Page number (default: 1)' },
    limit: { type: 'number', description: 'Number of courses per page (default: 10)' },
    search: { type: 'string', description: 'Search by course name or description' },
    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], description: 'Filter by difficulty level' },
    professions: { 
      type: 'array', 
      items: { type: 'number' }, 
      description: 'Array of profession IDs to filter courses (must be obtained via get_professions tool call)' 
    },
    all: { type: 'boolean', description: 'Get all courses without pagination' }
  }
};
const getCourseInputSchema = {
  type: 'object',
  properties: {
    courseId: { type: 'string', description: 'Course ID' }
  },
  required: ['courseId']
};
// Общие схемы для модулей и уроков
const lessonBaseSchema = {
  title: { type: 'string', description: 'Lesson title (required, automatically generates slug)' },
  content: { type: 'string', description: 'Main lesson content (HTML/Markdown, required if contentType !== "mixed")' },
  duration: { type: 'number', description: 'Lesson duration in minutes (optional, default: 0)' },
  type: { type: 'string', enum: ['text', 'video', 'interactive'], description: 'Lesson type (optional)' },
  contentType: { 
    type: 'string', 
    enum: ['standard', 'labyrinth', 'flippingCards', 'mixed', 'memoryGame', 'tagCloud', 'rolePlayGame', 'textReconstruction', 'presentation', 'fullHtml', 'htmlBlock', 'video'], 
    description: 'Content type (optional)' 
  },
  contentBlocks: {
    type: 'array',
    description: 'Content blocks (required if contentType === "mixed")',
    items: {
      type: 'object',
      properties: {
        type: { 
          type: 'string', 
          enum: ['standard', 'labyrinth', 'flippingCards', 'mixed', 'memoryGame', 'tagCloud', 'rolePlayGame', 'textReconstruction', 'presentation', 'fullHtml', 'htmlBlock', 'video'] 
        },
        content: { type: 'string', description: 'JSON string for complex content types' },
        order: { type: 'number', description: 'Order of the block' }
      },
      required: ['type', 'content', 'order']
    }
  },
  videoUrl: { type: 'string', description: 'Video URL (for video type lessons)' },
  resources: {
    type: 'array',
    description: 'Additional resources',
    items: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        type: { type: 'string' },
        description: { type: 'string' },
        url: { type: 'string' }
      },
      required: ['title', 'type', 'description', 'url']
    }
  },
  practiceExercises: {
    type: 'array',
    description: 'Practice exercises',
    items: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        codeSnippet: { type: 'string' },
        playgroundUrl: { type: 'string' }
      },
      required: ['title', 'description']
    }
  },
  isDraft: { type: 'boolean', description: 'Is draft (optional, default: true)' }
};
const courseModuleSchema = {
  type: 'object',
  properties: {
    module: { type: 'string', description: 'Module ID (required)' },
    order: { type: 'number', description: 'Order of module in course (required)' }
  },
  required: ['module', 'order']
};
const courseBaseSchema = {
  title: { type: 'string', description: 'Course title (required, automatically generates slug)' },
  description: { type: 'string', description: 'Course description (required)' },
  image: { type: 'string', description: 'Path to course image (optional, default standard image)' },
  videos: { 
    type: 'array', 
    items: { type: 'string' }, 
    description: 'Array of video URLs (optional)',
    default: []
  },
  modules: {
    type: 'array',
    description: 'Course modules with lesson IDs (create lessons first, then add their IDs to modules)',
    default: [],
    items: courseModuleSchema
  },
  professions: {
    type: 'array',
    items: { type: 'string' },
    description: 'Array of profession IDs from microservice (optional, can be empty array)',
    default: []
  },
  difficulty: { 
    type: 'string', 
    enum: ['beginner', 'intermediate', 'advanced'], 
    description: 'Difficulty level (required)' 
  },
  isDraft: { type: 'boolean', description: 'Is draft (optional, default: true)' }
};
const getLessonsInputSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', description: 'Page number (default: 1)' },
    limit: { type: 'number', description: 'Number of lessons per page (default: 10)' },
    search: { type: 'string', description: 'Search by lesson title or description' }
  }
};
const getLessonInputSchema = {
  type: 'object',
  properties: {
    courseId: { type: 'string', description: 'Course ID' },
    moduleId: { type: 'string', description: 'Module ID' },
    lessonId: { type: 'string', description: 'Lesson ID' }
  },
  required: ['courseId', 'moduleId', 'lessonId']
};
const createCourseInputSchema = {
  type: 'object',
  properties: {
    ...courseBaseSchema
  },
  required: ['title', 'description', 'difficulty'],
  description: 'Create a new course. IMPORTANT: Follow the correct creation order: 1) Create lessons using create_lesson, 2) Create tests using create_test (optional), 3) Create modules using create_module with lesson/test IDs, 4) Create course with module IDs in modules array. The system automatically generates slug, calculates duration, and sets default values.'
};
const updateCourseInputSchema = {
  type: 'object',
  properties: {
    courseId: { type: 'string', description: 'Course ID for update' },
    ...courseBaseSchema
  },
  required: ['courseId', 'title', 'description', 'difficulty'],
  description: 'Update an existing course. IMPORTANT: For new content, follow the correct order: 1) Create lessons using create_lesson, 2) Create tests using create_test (optional), 3) Create modules using create_module with lesson/test IDs, 4) Update course with new module IDs in modules array.'
};
const createLessonInputSchema = {
  type: 'object',
  properties: {
    ...lessonBaseSchema
  },
  required: ['title', 'type', 'contentType'],
  description: 'Create a new lesson. IMPORTANT: Use this FIRST before creating courses. The system automatically generates slug and sets default values. For mixed content type, use contentBlocks array instead of content field.'
};
const updateLessonInputSchema = {
  type: 'object',
  properties: {
    lessonId: { type: 'string', description: 'Lesson ID for update' },
    ...lessonBaseSchema
  },
  required: ['lessonId', 'title', 'type', 'contentType'],
  description: 'Update an existing lesson. For mixed content type, use contentBlocks array instead of content field.'
};
const getProfessionsInputSchema = {
  type: 'object',
  properties: {},
  description: 'Get all professions without pagination'
};

// Module schemas
const moduleBaseSchema = {
  title: { type: 'string', description: 'Module title (required, automatically generates slug)' },
  content: { type: 'string', description: 'Module description (required, plain text)' },
  description: { type: 'string', description: 'Module description (optional)' },
  lessons: {
    type: 'array',
    items: { type: 'string' },
    description: 'Array of lesson IDs (can be empty array)',
    default: []
  },
  tests: {
    type: 'array',
    items: { type: 'string' },
    description: 'Array of test IDs (can be empty array)',
    default: []
  },
  isDraft: { type: 'boolean', description: 'Is draft (optional, default: true)' }
};

const createModuleInputSchema = {
  type: 'object',
  properties: {
    ...moduleBaseSchema
  },
  required: ['title', 'content'],
  description: 'Create a new module. IMPORTANT: Create lessons first, then add their IDs to the lessons array. The system automatically generates slug and sets default values.'
};

const updateModuleInputSchema = {
  type: 'object',
  properties: {
    moduleId: { type: 'string', description: 'Module ID for update' },
    ...moduleBaseSchema
  },
  required: ['moduleId', 'title', 'content'],
  description: 'Update an existing module. For new lessons, create them first and add their IDs to the lessons array.'
};

const getModulesInputSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', description: 'Page number (default: 1)' },
    limit: { type: 'number', description: 'Number of modules per page (default: 10)' },
    search: { type: 'string', description: 'Search by module title or description' }
  },
  description: 'Get a list of modules with pagination and search'
};

const getModuleInputSchema = {
  type: 'object',
  properties: {
    moduleId: { type: 'string', description: 'Module ID' }
  },
  required: ['moduleId'],
  description: 'Get a specific module by ID'
};

// Test schemas
const testBaseSchema = {
  title: { type: 'string', description: 'Test title (required, automatically generates slug)' },
  description: { type: 'string', description: 'Test description (optional)' },
  module: { type: 'string', description: 'Module ID (required)' },
  questions: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Question text' },
        type: { type: 'string', enum: ['single-choice', 'multiple-choice', 'true-false', 'text', 'memory'], description: 'Question type' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              isCorrect: { type: 'boolean' }
            }
          },
          description: 'Answer options (for choice questions)'
        },
        points: { type: 'number', description: 'Points for this question' }
      },
      required: ['question', 'type', 'options', 'points']
    },
    description: 'Array of test questions'
  },
  passingScore: { type: 'number', description: 'Minimum score to pass (0-100)' },
  timeLimit: { type: 'number', description: 'Time limit in minutes (optional)' }
};

const createTestInputSchema = {
  type: 'object',
  properties: {
    ...testBaseSchema
  },
  required: ['title', 'module', 'questions'],
  description: 'Create a new test. IMPORTANT: Create modules first using create_module tool. The system automatically generates slug and sets default values.'
};

const updateTestInputSchema = {
  type: 'object',
  properties: {
    testId: { type: 'string', description: 'Test ID for update' },
    ...testBaseSchema
  },
  required: ['testId', 'title', 'module', 'questions'],
  description: 'Update an existing test. IMPORTANT: For new tests, create modules first using create_module tool.'
};

const getTestsInputSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', description: 'Page number (default: 1)' },
    limit: { type: 'number', description: 'Number of tests per page (default: 10)' },
    search: { type: 'string', description: 'Search by test title or description' }
  },
  description: 'Get a list of tests with pagination and search'
};

const getTestInputSchema = {
  type: 'object',
  properties: {
    testId: { type: 'string', description: 'Test ID' }
  },
  required: ['testId'],
  description: 'Get a specific test by ID'
};


// Available tools
const availableTools = [
  { name: 'get_courses', inputSchema: getCoursesInputSchema },
  { name: 'get_course', inputSchema: getCourseInputSchema },
  { name: 'create_course', inputSchema: createCourseInputSchema },
  { name: 'update_course', inputSchema: updateCourseInputSchema },
  { name: 'get_lessons', inputSchema: getLessonsInputSchema },
  { name: 'get_lesson', inputSchema: getLessonInputSchema },
  { name: 'create_lesson', inputSchema: createLessonInputSchema },
  { name: 'update_lesson', inputSchema: updateLessonInputSchema },
  { name: 'get_professions', inputSchema: getProfessionsInputSchema },
  { name: 'get_modules', inputSchema: getModulesInputSchema },
  { name: 'get_module', inputSchema: getModuleInputSchema },
  { name: 'create_module', inputSchema: createModuleInputSchema },
  { name: 'update_module', inputSchema: updateModuleInputSchema },
  { name: 'get_tests', inputSchema: getTestsInputSchema },
  { name: 'get_test', inputSchema: getTestInputSchema },
  { name: 'create_test', inputSchema: createTestInputSchema },
  { name: 'update_test', inputSchema: updateTestInputSchema },
];

// Create server
const server = new Server({
  name: 'oa-y-mcp-service',
  version: '2.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: availableTools
  };
});

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (!toolHandlers[name]) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
  try {
    return await toolHandlers[name](args);
  } catch (error) {
    return { content: [{ type: 'text', text: `Error executing ${name}: ${error.message}` }], isError: true };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OA-Y MCP Server started on stdio');
}

main().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
}); 