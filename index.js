#!/usr/bin/env node
/**
 * OA-Y MCP Service - STDIO Mode
 * Entry point for local integration via STDIO transport
 *
 * This mode is used for:
 * - Local integration with MCP clients (Cursor, Claude Desktop)
 * - NPX execution: npx github:AdminRHS/oa-y-mcp-service
 * - Direct node execution: node oa-y-mcp-service.cjs (bundled) or node index.js (source)
 *
 * Configuration via environment variables:
 * - APP_ENV: Application environment (prod/dev)
 * - API_TOKEN: OA-Y platform API token
 * - API_TOKEN_LIBS: Libraries API token (for professions)
 */

// Load environment variables
import 'dotenv/config';

// Start STDIO transport
import './src/transports/stdio.js';
