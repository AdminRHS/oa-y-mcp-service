#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL;
const API_BASE_URL_PROFESSIONS = process.env.API_BASE_URL_PROFESSIONS;
const API_TOKEN = process.env.API_TOKEN;

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

// Create server
const server = new Server({
  name: 'oa-y-learning-mcp',
  version: '2.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Set headers for API requests
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
});

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Courses
      {
        name: 'get_courses',
        inputSchema: getCoursesInputSchema
      },
      {
        name: 'get_course',
        inputSchema: getCourseInputSchema
      },
      {
        name: 'create_course',
        inputSchema: createCourseInputSchema
      },
      {
        name: 'update_course',
        inputSchema: updateCourseInputSchema
      },
      // Lessons
      {
        name: 'get_lessons',
        inputSchema: getLessonsInputSchema
      },
      {
        name: 'get_lesson',
        inputSchema: getLessonInputSchema
      },
      {
        name: 'create_lesson',
        inputSchema: createLessonInputSchema
      },
      {
        name: 'update_lesson',
        inputSchema: updateLessonInputSchema
      },
      // Professions
      {
        name: 'get_professions',
        inputSchema: getProfessionsInputSchema
      }
    ]
  };
});

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_courses': {
        const params = new URLSearchParams();
        if (args.page) params.append('page', args.page.toString());
        if (args.limit) params.append('limit', args.limit.toString());
        if (args.search) params.append('search', args.search);
        if (args.difficulty) params.append('difficulty', args.difficulty);
        if (args.all) params.append('all', 'true');

        const response = await fetch(`${API_BASE_URL}/courses?${params}`, {
          headers: getHeaders()
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      case 'get_course': {
        const response = await fetch(`${API_BASE_URL}/courses/${args.courseId}`, {
          headers: getHeaders()
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      case 'create_course': {
        // professions должны быть только id (строки), полученные через get_professions
        // Получите список профессий через get_professions отдельно и передайте их id в это поле
        let professions = args.professions || [];
        professions = professions.map(p => typeof p === 'object' && p._id ? p._id : p);
        // Сначала создаём все уроки для каждого модуля и собираем их id
        const modules = [];
        if (Array.isArray(args.modules)) {
          for (const mod of args.modules) {
            const lessonIds = [];
            if (Array.isArray(mod.lessons)) {
              for (const lesson of mod.lessons) {
                if (typeof lesson === 'string') {
                  // Just id of existing lesson
                  lessonIds.push(lesson);
                } else if (lesson._id) {
                  // Update existing lesson
                  const lessonResp = await fetch(`${API_BASE_URL}/lessons/${lesson._id}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify(lesson)
                  });
                  if (!lessonResp.ok) {
                    throw new Error(`Error updating lesson: ${lessonResp.status} ${lessonResp.statusText}`);
                  }
                  lessonIds.push(lesson._id);
                } else {
                  // Create lesson via API
                  const lessonResp = await fetch(`${API_BASE_URL}/lessons`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(lesson)
                  });
                  if (!lessonResp.ok) {
                    throw new Error(`Error creating lesson: ${lessonResp.status} ${lessonResp.statusText}`);
                  }
                  const lessonData = await lessonResp.json();
                  if (lessonData.success && lessonData.data && lessonData.data._id) {
                    lessonIds.push(lessonData.data._id);
                  } else {
                    throw new Error('Error creating lesson: _id not received');
                  }
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
        // Send request to create course
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
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(courseData)
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      case 'update_course': {
        // professions должны быть только id (строки), полученные через get_professions
        // Получите список профессий через get_professions отдельно и передайте их id в это поле
        let professions = args.professions || [];
        professions = professions.map(p => typeof p === 'object' && p._id ? p._id : p);
        const courseData = {
          _id: args.courseId,
          ...args,
          professions
        };
        const courseId = args.courseId;
        delete courseData.courseId;
        // Process modules and create lessons via API if needed
        if (Array.isArray(courseData.modules)) {
          for (const mod of courseData.modules) {
            if (Array.isArray(mod.lessons)) {
              for (let i = 0; i < mod.lessons.length; i++) {
                const lesson = mod.lessons[i];
                if (typeof lesson === 'string') {
                  // Just id of existing lesson
                  continue;
                } else if (lesson._id) {
                  // Update existing lesson
                  const lessonResp = await fetch(`${API_BASE_URL}/lessons/${lesson._id}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify(lesson)
                  });
                  if (!lessonResp.ok) {
                    throw new Error(`Error updating lesson: ${lessonResp.status} ${lessonResp.statusText}`);
                  }
                } else {
                  // Create new lesson
                  const lessonResp = await fetch(`${API_BASE_URL}/lessons`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(lesson)
                  });
                  if (!lessonResp.ok) {
                    throw new Error(`Error creating lesson: ${lessonResp.status} ${lessonResp.statusText}`);
                  }
                  const lessonData = await lessonResp.json();
                  if (lessonData.success && lessonData.data && lessonData.data._id) {
                    mod.lessons[i] = lessonData.data._id;
                  } else {
                    throw new Error('Error creating lesson: _id not received');
                  }
                }
              }
              // After all operations, replace objects-lessons with id
              mod.lessons = mod.lessons.map(lesson => typeof lesson === 'object' && lesson._id ? lesson._id : lesson);
            }
          }
        }
        // Update course via API
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(courseData)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      case 'get_lessons': {
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
        const response = await fetch(`${API_BASE_URL}/lessons?${params}`, {
          headers: getHeaders()
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      case 'get_lesson': {
        const response = await fetch(`${API_BASE_URL}/lessons/${args.lessonId}`, {
          headers: getHeaders()
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      case 'create_lesson': {
        const lessonData = { ...args };
        const response = await fetch(`${API_BASE_URL}/lessons`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(lessonData)
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      case 'update_lesson': {
        const lessonId = args.lessonId || args._id;
        if (!lessonId) {
          throw new Error('lessonId is required');
        }
        const lessonData = { ...args };
        delete lessonData.lessonId;
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(lessonData)
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      case 'get_professions': {
        const response = await fetch(`${API_BASE_URL_PROFESSIONS}/profession`, {
          headers: getHeaders()
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`
        }
      ],
      isError: true
    };
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
