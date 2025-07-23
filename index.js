#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { prodToolHandlers } from './prodToolHandlers.js';

const API_TOKEN = process.env.API_TOKEN;

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
