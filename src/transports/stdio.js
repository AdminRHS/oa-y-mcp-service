#!/usr/bin/env node
/**
 * STDIO Transport for OA-Y MCP Service
 * Handles MCP protocol via standard input/output
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Import centralized modules
import { toolDefinitions } from '../core/schemas.js';
import { mcpToolHandlers } from '../core/handlers.js';

/**
 * Create MCP Server instance
 */
const server = new Server({
  name: 'oa-y-mcp-service',
  version: '2.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

/**
 * List tools handler
 * Returns all available tools with their schemas
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions
  };
});

/**
 * Call tool handler
 * Executes the requested tool with provided arguments
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Check if tool exists
  if (!mcpToolHandlers[name]) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true
    };
  }

  try {
    // Execute tool handler
    return await mcpToolHandlers[name](args || {});
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error executing ${name}: ${error.message}` }],
      isError: true
    };
  }
});

/**
 * Start STDIO server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run server and handle errors
main().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
