#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const API_BASE_URL = 'https://lrn.oa-y.com/api';
const API_TOKEN = process.env.API_TOKEN;

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
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number (default: 1)'
            },
            limit: {
              type: 'number',
              description: 'Number of courses per page (default: 10)'
            },
            search: {
              type: 'string',
              description: 'Search by course name or description'
            },
            difficulty: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'Filter by difficulty level'
            },
            all: {
              type: 'boolean',
              description: 'Get all courses without pagination'
            }
          }
        }
      },
      {
        name: 'get_course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: {
              type: 'string',
              description: 'Course ID'
            }
          },
          required: ['courseId']
        }
      },
      {
        name: 'create_course',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Course title'
            },
            description: {
              type: 'string',
              description: 'Course description'
            },
            difficulty: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'Difficulty level'
            },
            modules: {
              type: 'array',
              description: 'Course modules',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  content: { type: 'string' },
                  order: { type: 'number' },
                  lessons: {
                    type: 'array',
                    description: 'Module lessons (array of objects or IDs)',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        content: { type: 'string' },
                        duration: { type: 'number' },
                        type: { type: 'string' },
                        contentType: { type: 'string' },
                        resources: { type: 'array' },
                        practiceExercises: { type: 'array' },
                        contentBlocks: { type: 'array' }
                      }
                    }
                  },
                  tests: {
                    type: 'array',
                    description: 'Module tests (array of objects)',
                    items: { type: 'object' }
                  }
                }
              }
            },
            professions: {
              type: 'array',
              description: 'Professions (array of strings)',
              items: { type: 'string' }
            },
            image: {
              type: 'string',
              description: 'Course image URL'
            },
            isDraft: {
              type: 'boolean',
              description: 'Course is a draft'
            }
          },
          required: ['title', 'description', 'difficulty']
        }
      },
      {
        name: 'update_course',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: {
              type: 'string',
              description: 'Course ID for update'
            },
            title: {
              type: 'string',
              description: 'Course title'
            },
            description: {
              type: 'string',
              description: 'Course description'
            },
            difficulty: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'Difficulty level'
            },
            modules: {
              type: 'array',
              description: 'Course modules'
            },
            isDraft: {
              type: 'boolean',
              description: 'Course is a draft'
            }
          },
          required: ['courseId']
        }
      },
      // Lessons
      {
        name: 'get_lesson',
        inputSchema: {
          type: 'object',
          properties: {
            courseId: {
              type: 'string',
              description: 'Course ID'
            },
            moduleId: {
              type: 'string',
              description: 'Module ID'
            },
            lessonId: {
              type: 'string',
              description: 'Lesson ID'
            }
          },
          required: ['courseId', 'moduleId', 'lessonId']
        }
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
        const courseData = {
          title: args.title,
          description: args.description,
          difficulty: args.difficulty,
          professions: args.professions || [],
          image: args.image,
          isDraft: args.isDraft || false,
          modules: []
        };
        // Process modules and create lessons via API if needed
        if (Array.isArray(args.modules)) {
          for (const mod of args.modules) {
            const moduleData = {
              title: mod.title,
              description: mod.description || '',
              content: mod.content || '',
              order: mod.order || 0,
              lessons: [],
              tests: mod.tests || []
            };
            // If lessons are objects (without _id), create them via API
            if (Array.isArray(mod.lessons)) {
              for (const lesson of mod.lessons) {
                if (lesson._id) {
                  moduleData.lessons.push(lesson._id);
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
                    moduleData.lessons.push(lessonData.data._id);
                  } else {
                    throw new Error('Error creating lesson: _id not received');
                  }
                }
              }
            }
            courseData.modules.push(moduleData);
          }
        }
        // Send request to create course
        const response = await fetch(`${API_BASE_URL}/course`, {
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
        const courseData = {
          _id: args.courseId,
          ...args
        };
        delete courseData.courseId;

        const response = await fetch(`${API_BASE_URL}/course`, {
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

      case 'get_lesson': {
        const response = await fetch(`${API_BASE_URL}/courses/${args.courseId}/modules/${args.moduleId}/lessons/${args.lessonId}`, {
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
