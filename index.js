#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const API_TOKEN = process.env.API_TOKEN;
const API_BASE_URL = 'https://oa-y.com';

let legacyJwt = null;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
});

const prodToolHandlers = {
  async login(args) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: args.email, password: args.password })
    });
    const data = await response.json();
    if (data.token) {
      legacyJwt = data.token;
      return { content: [{ type: 'text', text: 'Login successful' }] };
    } else {
      throw new Error(data.message || 'Login failed');
    }
  },
  async create_or_update_course(args) {
    const response = await fetch(`${API_BASE_URL}/api/course`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(args)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_courses(args) {
    if (!legacyJwt) throw new Error('Not logged in. Please use login first.');
    const params = new URLSearchParams();
    if (args.page) params.append('page', args.page.toString());
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    const response = await fetch(`${API_BASE_URL}/api/courses?${params}`, {
      headers: { 'Authorization': `Bearer ${legacyJwt}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_categories() {
    if (!legacyJwt) throw new Error('Not logged in. Please use login first.');
    const response = await fetch(`${API_BASE_URL}/api/categories?all=true`, {
      headers: { 'Authorization': `Bearer ${legacyJwt}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_profile() {
    if (!legacyJwt) throw new Error('Not logged in. Please use login first.');
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${legacyJwt}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
};

export { API_TOKEN };

// Legacy input schemas
const legacyCourseInputSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', description: 'Course ID (for update)' },
    title: { type: 'string', description: 'Course title' },
    description: { type: 'string', description: 'Course description' },
    category: { type: 'string', description: 'Course category ID' },
    instructor: { type: 'string', description: 'Course instructor ID' },
    difficulty: { type: 'string', description: 'Course difficulty' },
    modules: { 
      type: 'array', 
      items: { 
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Module title (REQUIRED)' },
          content: { type: 'string', description: 'Module content (REQUIRED)' },
          description: { type: 'string', description: 'Module description (OPTIONAL)' },
          order: { type: 'number', description: 'Module order (REQUIRED)' },
          lessons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Lesson title (REQUIRED for all lessons)' },
                content: { type: 'string', description: 'Lesson content (REQUIRED for standard content types, NOT for mixed type)' },
                duration: { type: 'number', description: 'Duration in minutes (REQUIRED for all lessons)' },
                type: { type: 'string', description: 'Lesson type (text, video, interactive) - REQUIRED for all lessons', default: 'text' },
                contentType: { type: 'string', description: 'Content type (standard, labyrinth, flippingCards, mixed, memoryGame, tagCloud, rolePlayGame) - REQUIRED for all lessons', default: 'standard' },
                videoUrl: { type: 'string', description: 'Video URL (for video type lessons)' },
                contentBlocks: {
                  type: 'array',
                  description: 'REQUIRED for mixed content type, contains different content blocks',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', description: 'Block type (REQUIRED for mixed content)' },
                      content: { type: 'string', description: 'Block content (REQUIRED for mixed content)' },
                      order: { type: 'number', description: 'Block order (REQUIRED for mixed content)' }
                    },
                    required: ['type', 'content', 'order']
                  }
                },
                resources: {
                  type: 'array',
                  description: 'Optional resources for the lesson',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Resource title' },
                      type: { type: 'string', description: 'Resource type' },
                      description: { type: 'string', description: 'Resource description' },
                      url: { type: 'string', description: 'Resource URL' }
                    },
                    required: ['title', 'type', 'description', 'url']
                  }
                },
                practiceExercises: {
                  type: 'array',
                  description: 'Optional practice exercises for the lesson',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Exercise title' },
                      description: { type: 'string', description: 'Exercise description' },
                      codeSnippet: { type: 'string', description: 'Code snippet' },
                      playgroundUrl: { type: 'string', description: 'Playground URL' }
                    },
                    required: ['title', 'description']
                  }
                }
              },
              required: ['title', 'duration', 'type', 'contentType']
            }
          }
        },
        required: ['title', 'content', 'order']
      }
    },
    image: { type: 'string' },
    duration: { type: 'number' }
  },
  required: ['title', 'description', 'category', 'instructor', 'difficulty']
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
    search: { type: 'string', description: 'Search by course name or description' }
  }
};

const legacyGetCategoriesInputSchema = {
  type: 'object',
  properties: {
    profile: { type: 'boolean', description: 'If true, returns profile categories' }
  }
};

const legacyGetProfilesInputSchema = {
  type: 'object',
  properties: {}
};

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
  },
  {
    name: 'get_categories',
    inputSchema: legacyGetCategoriesInputSchema
  },
  {
    name: 'get_profile',
    inputSchema: legacyGetProfilesInputSchema
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
    tools: prodTools
  };
});

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (!prodToolHandlers[name]) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
  try {
    return await prodToolHandlers[name](args);
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
