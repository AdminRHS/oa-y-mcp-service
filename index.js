#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { devToolHandlers } from './devToolHandlers.js';
import { prodToolHandlers } from './prodToolHandlers.js';

const APP_ENV = process.env.APP_ENV || 'prod'; // 'dev' | 'prod'
const API_TOKEN = process.env.API_TOKEN || '';

const API_BASE_URL = APP_ENV === 'dev'
  ? 'https://lrn.oa-y.com/api-tokens'
  : 'https://oa-y.com';
const API_BASE_URL_PROFESSIONS = APP_ENV === 'dev'
  ? 'https://libdev.anyemp.com/api'
  : undefined;

export { API_BASE_URL, API_BASE_URL_PROFESSIONS, API_TOKEN, APP_ENV };

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
  // IMPORTANT: if contentType === 'mixed', then contentBlocks is required, otherwise content is required
  content: { type: 'string', description: 'Lesson content (required if contentType === "mixed")' },
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
      required: ['type', 'content']
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
    description: 'Course modules',
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
  required: ['title', 'description', 'difficulty']
};
const updateCourseInputSchema = {
  type: 'object',
  properties: {
    courseId: { type: 'string', description: 'Course ID for update' },
    ...courseBaseSchema
  },
  required: ['courseId', 'title', 'description', 'difficulty']
};
const createLessonInputSchema = {
  type: 'object',
  properties: {
    ...lessonBaseSchema
  },
  // IMPORTANT: if contentType === 'mixed', then contentBlocks is required, otherwise content is required
  required: ['title', 'type', 'contentType']
};
const updateLessonInputSchema = {
  type: 'object',
  properties: {
    lessonId: { type: 'string', description: 'Lesson ID for update' },
    ...lessonBaseSchema
  },
  required: ['lessonId', 'title', 'type', 'contentType']
};
const getProfessionsInputSchema = {
  type: 'object',
  properties: {}
};

// Legacy input schemas
const legacyCourseInputSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', description: 'Course ID (for update)' },
    title: { type: 'string', description: 'Course title' },
    description: { type: 'string', description: 'Course description' },
    category: { type: 'string', description: 'Course category' },
    difficulty: { type: 'string', description: 'Course difficulty' },
    modules: { type: 'array', items: { type: 'object' }, default: [] },
    image: { type: 'string' },
    duration: { type: 'number' }
  },
  required: ['title', 'description', 'category', 'difficulty']
};
const legacyBatchImportInputSchema = {
  type: 'object',
  properties: {
    courses: {
      type: 'array',
      items: legacyCourseInputSchema,
      description: 'Array of courses to import'
    }
  },
  required: ['courses']
};

// Legacy input schemas
const legacyLoginInputSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', description: 'User email' },
    password: { type: 'string', description: 'User password' }
  },
  required: ['email', 'password']
};
const legacyGetCoursesInputSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', description: 'Page number (default: 1)' },
    limit: { type: 'number', description: 'Number of courses per page (default: 10)' },
    search: { type: 'string', description: 'Search by course name or description' },
    all: { type: 'boolean', description: 'If true, returns all courses without pagination' }
  }
};

// New tools (new API)
const newTools = [
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

const prodTools = [
  {
    name: 'create_or_update_course',
    inputSchema: legacyCourseInputSchema
  },
  {
    name: 'get_courses',
    inputSchema: legacyGetCoursesInputSchema
  },
  {
    name: 'login',
    inputSchema: legacyLoginInputSchema
  }
];

// Create server
const server = new Server({
  name: 'oa-y-learning-mcp',
  version: '2.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: APP_ENV === 'dev' ? newTools : prodTools
  };
});

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const toolHandlers = APP_ENV === 'dev' ? devToolHandlers : prodToolHandlers;
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
  console.error('OA-Y Learning MCP Server started on stdio');
}

main().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
