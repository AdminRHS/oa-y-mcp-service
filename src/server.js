#!/usr/bin/env node
/**
 * OA-Y MCP Service - HTTP Mode
 * Entry point for remote integration via StreamableHTTP transport
 *
 * This mode is used for:
 * - Remote MCP integration via HTTP
 * - Team/cloud deployments
 * - Multiple clients connecting to shared instance
 *
 * Configuration via environment variables:
 * - APP_ENV: Application environment (prod/dev)
 * - API_TOKEN: OA-Y platform API token
 * - API_TOKEN_LIBS: Libraries API token (for professions)
 * - PORT: HTTP server port (default: 3000)
 *
 * Endpoints:
 * - POST /mcp     - MCP StreamableHTTP endpoint
 * - GET  /health  - Health check
 * - GET  /        - Service info
 */

// Load environment variables
import 'dotenv/config';

// Import StreamableHTTP transport
import { startStreamableHttpServer } from './transports/streamable-http.js';

// Start the server
startStreamableHttpServer();
