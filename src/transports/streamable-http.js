/**
 * StreamableHTTP Transport for OA-Y MCP Service
 * Handles MCP protocol via HTTP Streamable protocol (SSE replacement)
 * 
 * This is the modern, recommended transport method for MCP.
 * Replaces deprecated SSE transport with better reliability.
 */

import express from 'express';
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Import centralized modules
import { config, setRuntimeConfig } from '../core/config.js';
import { toolDefinitions } from '../core/schemas.js';
import { mcpToolHandlers } from '../core/handlers.js';

/**
 * Create MCP server instance (singleton)
 * Server is created once and reused for all requests
 */
const mcpServer = new McpServer({
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
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions
  };
});

/**
 * Call tool handler
 * Executes the requested tool with provided arguments
 */
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
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
 * Create Express app with StreamableHTTP endpoints
 * @returns {Express} Configured Express app
 */
export function createStreamableHttpApp() {
  const app = express();

  // Middleware for parsing JSON
  app.use(express.json());

  /**
   * MCP StreamableHTTP endpoint (GET)
   * Some clients start with a GET request to establish a stream/handshake
   */
  app.get('/mcp', async (req, res) => {
    console.log('📡 StreamableHTTP GET request received');

    try {
      // Optional runtime overrides via query params
      const { API_TOKEN, API_TOKEN_LIBS, APP_ENV } = req.query;
      setRuntimeConfig({
        apiToken: typeof API_TOKEN === 'string' ? API_TOKEN : undefined,
        apiTokenLibs: typeof API_TOKEN_LIBS === 'string' ? API_TOKEN_LIBS : undefined,
        appEnv: typeof APP_ENV === 'string' ? APP_ENV : undefined
      });

      // Create new transport for this request
      const transport = new StreamableHTTPServerTransport({});

      // Clean up transport when response closes
      res.on('close', () => {
        console.log('🔌 Response closed (GET), cleaning up transport');
        transport.close();
      });

      // Connect MCP server to this transport
      await mcpServer.connect(transport);

      // Handle the request (will create an SSE stream per StreamableHTTP spec)
      await transport.handleRequest(req, res);

      console.log('✅ GET /mcp handled successfully');
    } catch (error) {
      console.error('❌ Error handling GET /mcp:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error handling GET /mcp', message: error.message });
      }
    }
  });

  /**
   * MCP StreamableHTTP endpoint
   * Handles all MCP protocol communication
   * Transport is created per-request as recommended by SDK
   */
  app.post('/mcp', async (req, res) => {
    console.log('📡 StreamableHTTP POST request received');

    try {
      // Optional runtime overrides via query/body
      const { API_TOKEN, API_TOKEN_LIBS, APP_ENV } = req.query;
      const body = (req.body && typeof req.body === 'object') ? req.body : {};
      setRuntimeConfig({
        apiToken: (typeof body.API_TOKEN === 'string' && body.API_TOKEN) || (typeof API_TOKEN === 'string' ? API_TOKEN : undefined),
        apiTokenLibs: (typeof body.API_TOKEN_LIBS === 'string' && body.API_TOKEN_LIBS) || (typeof API_TOKEN_LIBS === 'string' ? API_TOKEN_LIBS : undefined),
        appEnv: (typeof body.APP_ENV === 'string' && body.APP_ENV) || (typeof APP_ENV === 'string' ? APP_ENV : undefined)
      });

      // Create new transport for this request
      const transport = new StreamableHTTPServerTransport({
        enableJsonResponse: true
      });

      // Clean up transport when response closes
      res.on('close', () => {
        console.log('🔌 Response closed, cleaning up transport');
        transport.close();
      });

      // Connect MCP server to this transport
      await mcpServer.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);

      console.log('✅ Request handled successfully');

    } catch (error) {
      console.error('❌ Error handling request:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Error handling request',
          message: error.message,
          type: error.name
        });
      }
    }
  });

  /**
   * Health check endpoint
   * GET /health
   */
  app.get('/health', (req, res) => {
    res.json({
      status: 'up',
      service: 'OA-Y MCP HTTP Server (StreamableHTTP Mode)',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      environment: config.env,
      mode: 'StreamableHTTP (recommended)',
      transport: 'Per-request transport instances',
      note: 'SSE transport is deprecated, using modern StreamableHTTP'
    });
  });

  /**
   * Root endpoint
   * GET /
   */
  app.get('/', (req, res) => {
    res.json({
      service: 'OA-Y MCP HTTP Server (StreamableHTTP Mode)',
      version: '2.0.0',
      description: 'MCP Server via StreamableHTTP - Modern, recommended transport',
      endpoints: {
        health: 'GET /health',
        mcp: 'POST /mcp (Streamable HTTP protocol)'
      },
      documentation: 'See README.md for usage instructions',
      note: 'StreamableHTTP is the recommended transport (SSE is deprecated)'
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      message: `The endpoint ${req.method} ${req.path} does not exist`,
      availableEndpoints: [
        'GET /',
        'GET /health',
        'POST /mcp (MCP protocol endpoint)'
      ]
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      stack: config.isDev ? err.stack : undefined
    });
  });

  return app;
}

/**
 * Start StreamableHTTP server
 * @param {number} port - Port to listen on
 * @returns {Server} HTTP server instance
 */
export function startStreamableHttpServer(port = config.port) {
  const app = createStreamableHttpApp();

  const server = app.listen(port, () => {
    console.log(`✅ OAY MCP HTTP Server (StreamableHTTP Mode) запущено на порті ${port}`);
    console.log(`📍 Environment: ${config.env}`);
    console.log(`🔓 Authorization: DISABLED (no auth required)`);
    console.log('');
    console.log('🔌 MCP StreamableHTTP Endpoint:');
    console.log(`   POST http://localhost:${port}/mcp`);
    console.log('');
    console.log(`ℹ️  Health check: http://localhost:${port}/health`);
    console.log('');
    console.log('⚠️  NOTE: SSE transport is DEPRECATED - using modern StreamableHTTP');
    console.log('');
    console.log('📝 Configure in Claude Desktop/Cursor mcp.json:');
    console.log('   {');
    console.log('     "mcpServers": {');
    console.log('       "oa-y-mcp": {');
    console.log(`         "url": "http://localhost:${port}/mcp"`);
    console.log('       }');
    console.log('     }');
    console.log('   }');
    console.log('');
    console.log('💡 For Inspector:');
    console.log(`   npx @modelcontextprotocol/inspector http://localhost:${port}/mcp`);
  });

  return server;
}

