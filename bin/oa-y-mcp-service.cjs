#!/usr/bin/env node
/**
 * OA-Y MCP Service - STDIO Mode (Binary Entry Point)
 * Entry point for NPX execution
 */

const path = require('path');

// Load environment variables
require('dotenv/config');

// Start STDIO transport (bundled)
require(path.join(__dirname, '../dist/stdio.cjs'));
