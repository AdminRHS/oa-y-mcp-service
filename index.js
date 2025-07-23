#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const API_TOKEN = process.env.API_TOKEN;
const API_BASE_URL = 'https://oa-y.com/api-tokens';

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
    const response = await fetch(`${API_BASE_URL}/api-token/course`, {
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
    if (args.all) params.append('all', 'true');
    const response = await fetch(`${API_BASE_URL}/api/courses?${params}`, {
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
