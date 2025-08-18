#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Validate required environment variables
if (!process.env.APP_ENV) {
  throw new Error('APP_ENV environment variable is required. Set it to "dev" or "prod"');
}

if (!process.env.API_TOKEN) {
  throw new Error('API_TOKEN environment variable is required. Get your token from https://oa-y.com');
}

const APP_ENV = process.env.APP_ENV;
const API_TOKEN = process.env.API_TOKEN;

// Validate APP_ENV value
if (APP_ENV !== 'dev' && APP_ENV !== 'prod') {
  throw new Error(`Invalid APP_ENV value: "${APP_ENV}". Must be "dev" or "prod"`);
}

// API URLs based on environment
const API_BASE_URL = APP_ENV === 'dev' 
  ? 'https://lrn.oa-y.com/api-tokens'
  : 'https://oa-y.com/api-tokens';

const API_BASE_URL_PROFESSIONS = APP_ENV === 'dev'
  ? 'https://libdev.anyemp.com/api'
  : 'https://libs.anyemp.com/api';

// Headers for API requests
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
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
    
    // Process modules - expect lesson IDs, not lesson objects
    const modules = [];
    if (Array.isArray(args.modules)) {
      for (const mod of args.modules) {
        const lessonIds = [];
        if (Array.isArray(mod.lessons)) {
          for (const lessonId of mod.lessons) {
            if (typeof lessonId === 'string') {
              lessonIds.push(lessonId);
            } else {
              throw new Error('Lesson IDs must be strings. Create lessons first using create_lesson tool.');
            }
          }
        }
        modules.push({
          title: mod.title,
          description: mod.description || '',
          content: mod.content || '',
          order: mod.order || 0,
          duration: mod.duration || 0,
          lessons: lessonIds,
          tests: mod.tests || [],
          achievements: mod.achievements || []
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
    const courseData = { _id: args.courseId, ...args, professions };
    const courseId = args.courseId;
    delete courseData.courseId;
    
    // Process modules - expect lesson IDs, not lesson objects
    if (Array.isArray(courseData.modules)) {
      for (const mod of courseData.modules) {
        if (Array.isArray(mod.lessons)) {
          for (let i = 0; i < mod.lessons.length; i++) {
            const lessonId = mod.lessons[i];
            if (typeof lessonId === 'string') {
              continue; // Valid lesson ID
            } else {
              throw new Error('Lesson IDs must be strings. Create lessons first using create_lesson tool.');
            }
          }
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
    const lessonData = { ...args };
    delete lessonData.lessonId;
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(lessonData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_professions() {
    const response = await fetch(`${API_BASE_URL_PROFESSIONS}/profession?all=true`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
};

// Input Schemas
const getCoursesInputSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', description: 'Page number (default: 1)' },
    limit: { type: 'number', description: 'Number of courses per page (default: 10)' },
    search: { type: 'string', description: 'Search by course name or description' },
    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], description: 'Filter by difficulty level' },
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
  title: { type: 'string', description: 'Lesson title' },
  content: { type: 'string', description: 'Lesson content (required if contentType !== "mixed")' },
  duration: { type: 'number', description: 'Lesson duration in minutes' },
  completed: { type: 'boolean', description: 'Is lesson completed' },
  type: { type: 'string', enum: ['text', 'video', 'interactive'], description: 'Lesson type' },
  contentType: { type: 'string', enum: ['standard','labyrinth','flippingCards','mixed','memoryGame','tagCloud','rolePlayGame','textReconstruction','html','video'], description: 'Content type' },
  contentBlocks: {
    type: 'array',
    description: 'Content blocks (array of objects, required if contentType === "mixed")',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['standard','labyrinth','flippingCards','mixed','memoryGame','tagCloud','rolePlayGame','textReconstruction','html','video'] },
        content: { type: 'string' },
        order: { type: 'number' }
      },
      required: ['type', 'content', 'order']
    }
  },
  videoUrl: { type: 'string', description: 'Video URL' },
  resources: {
    type: 'array',
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
  isDraft: { type: 'boolean', description: 'Is draft' }
};
const courseModuleSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    content: { type: 'string' },
    order: { type: 'number' },
    duration: { type: 'number', description: 'Module duration in minutes' },
    lessons: { type: 'array', items: { type: 'string' }, default: [] },
    tests: { type: 'array', items: { type: 'string' }, default: [] },
    achievements: { type: 'array', items: { type: 'string' }, default: [] }
  },
  required: ['title', 'content']
};
const courseBaseSchema = {
  title: { type: 'string', description: 'Course title' },
  description: { type: 'string', description: 'Course description' },
  image: { type: 'string' },
  modules: {
    type: 'array',
    description: 'Course modules with lesson IDs (create lessons first, then add their IDs to modules)',
    default: [],
    items: courseModuleSchema
  },
  professions: {
    type: 'array',
    items: { type: 'string' },
    description: 'Array of profession IDs (must be obtained via get_professions tool call)',
    default: []
  },
  difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], description: 'Difficulty level' },
  duration: { type: 'number', description: 'Course duration in minutes (optional)' },
  isDraft: { type: 'boolean' }
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
  description: 'Create a new course. Note: Create lessons first using create_lesson, then add lesson IDs to modules.'
};
const updateCourseInputSchema = {
  type: 'object',
  properties: {
    courseId: { type: 'string', description: 'Course ID for update' },
    ...courseBaseSchema
  },
  required: ['courseId', 'title', 'description', 'difficulty'],
  description: 'Update an existing course. Note: Create new lessons first using create_lesson, then add lesson IDs to modules.'
};
const createLessonInputSchema = {
  type: 'object',
  properties: {
    ...lessonBaseSchema
  },
  required: ['title', 'type', 'contentType'],
  description: 'Create a new lesson. Use this before creating/updating courses to get lesson IDs.'
};
const updateLessonInputSchema = {
  type: 'object',
  properties: {
    lessonId: { type: 'string', description: 'Lesson ID for update' },
    ...lessonBaseSchema
  },
  required: ['lessonId', 'title', 'type', 'contentType'],
  description: 'Update an existing lesson.'
};
const getProfessionsInputSchema = {
  type: 'object',
  properties: {}
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
  { name: 'get_professions', inputSchema: getProfessionsInputSchema }
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