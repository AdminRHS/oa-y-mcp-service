#!/usr/bin/env node
/**
 * Build script for OA-Y MCP Service
 * Compiles ESM source files to CommonJS for distribution
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('🔨 Building OA-Y MCP Service...\n');

// Build files
const builds = [
  {
    name: 'config',
    entry: 'src/core/config.js',
    output: 'dist/config.cjs'
  },
  {
    name: 'schemas',
    entry: 'src/core/schemas.js',
    output: 'dist/schemas.cjs'
  },
  {
    name: 'handlers',
    entry: 'src/core/handlers.js',
    output: 'dist/handlers.cjs'
  },
  {
    name: 'stdio',
    entry: 'src/transports/stdio.js',
    output: 'dist/stdio.cjs'
  }
];

builds.forEach(({ name, entry, output }) => {
  console.log(`📦 Building ${name}...`);
  try {
    execSync(
      `npx esbuild ${entry} --bundle --platform=node --outfile=${output} --format=cjs --external:@modelcontextprotocol/sdk --external:dotenv`,
      { stdio: 'inherit', cwd: rootDir }
    );
    console.log(`✅ ${name} built successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to build ${name}`);
    process.exit(1);
  }
});

console.log('✨ Build completed successfully!');
