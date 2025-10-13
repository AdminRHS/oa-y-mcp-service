/**
 * Configuration module for OA-Y MCP Service
 * Centralized configuration management
 */

// Load environment variables from .env file (if present)
import 'dotenv/config';

/**
 * Validate required environment variables
 * @throws {Error} If required environment variables are missing
 */
function normalizeAppEnv(value) {
  return value === 'dev' || value === 'prod' ? value : 'prod';
}

/**
 * Environment configuration
 */
export const config = {
  // Environment
  env: normalizeAppEnv(process.env.APP_ENV || 'prod'),
  get isDev() { return this.env === 'dev'; },
  get isProd() { return this.env === 'prod'; },

  // Tokens
  apiToken: process.env.API_TOKEN,
  apiTokenLibs: process.env.API_TOKEN_LIBS,

  // Server
  port: parseInt(process.env.PORT || '3000', 10),

  // API URLs
  apiBaseUrl: (process.env.APP_ENV || 'prod') === 'dev'
    ? 'https://lrn.oa-y.com/api-tokens'
    : 'https://oa-y.com/api-tokens',

  apiBaseUrlProfessions: (process.env.APP_ENV || 'prod') === 'dev'
    ? 'https://libdev.anyemp.com/api/token'
    : 'https://libs.anyemp.com/api/token',
};

/**
 * Apply runtime overrides (e.g., from HTTP query params)
 * @param {{ apiToken?: string, apiTokenLibs?: string, appEnv?: 'dev'|'prod' }} overrides
 */
export function setRuntimeConfig(overrides = {}) {
  if (overrides.appEnv) {
    config.env = normalizeAppEnv(overrides.appEnv);
  }
  if (typeof overrides.apiToken === 'string' && overrides.apiToken.length > 0) {
    config.apiToken = overrides.apiToken;
  }
  if (typeof overrides.apiTokenLibs === 'string' && overrides.apiTokenLibs.length > 0) {
    config.apiTokenLibs = overrides.apiTokenLibs;
  }
}

/**
 * Get headers for OA-Y API requests
 * @returns {Object} Headers object
 */
export function getApiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiToken}`
  };
}

/**
 * Get headers for Libs API requests
 * @returns {Object} Headers object
 */
export function getLibsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiTokenLibs}`
  };
}

/**
 * Build API URL for OA-Y endpoints
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full API URL
 */
export function buildApiUrl(endpoint) {
  return `${config.apiBaseUrl}${endpoint}`;
}

/**
 * Build API URL for Libs endpoints
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full API URL
 */
export function buildLibsUrl(endpoint) {
  return `${config.apiBaseUrlProfessions}${endpoint}`;
}
