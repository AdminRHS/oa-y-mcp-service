var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core/config.js
var config_exports = {};
__export(config_exports, {
  buildApiUrl: () => buildApiUrl,
  buildLibsUrl: () => buildLibsUrl,
  config: () => config,
  getApiHeaders: () => getApiHeaders,
  getLibsHeaders: () => getLibsHeaders,
  setRuntimeConfig: () => setRuntimeConfig
});
module.exports = __toCommonJS(config_exports);
var import_config = require("dotenv/config");
function normalizeAppEnv(value) {
  return value === "dev" || value === "prod" ? value : "prod";
}
var config = {
  // Environment
  env: normalizeAppEnv(process.env.APP_ENV || "prod"),
  get isDev() {
    return this.env === "dev";
  },
  get isProd() {
    return this.env === "prod";
  },
  // Tokens
  apiToken: process.env.API_TOKEN,
  apiTokenLibs: process.env.API_TOKEN_LIBS,
  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  // API URLs
  apiBaseUrl: (process.env.APP_ENV || "prod") === "dev" ? "https://lrn.oa-y.com/api-tokens" : "https://oa-y.com/api-tokens",
  apiBaseUrlProfessions: (process.env.APP_ENV || "prod") === "dev" ? "https://libdev.anyemp.com/api/token" : "https://libs.anyemp.com/api/token"
};
function setRuntimeConfig(overrides = {}) {
  if (overrides.appEnv) {
    config.env = normalizeAppEnv(overrides.appEnv);
  }
  if (typeof overrides.apiToken === "string" && overrides.apiToken.length > 0) {
    config.apiToken = overrides.apiToken;
  }
  if (typeof overrides.apiTokenLibs === "string" && overrides.apiTokenLibs.length > 0) {
    config.apiTokenLibs = overrides.apiTokenLibs;
  }
}
function getApiHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiToken}`
  };
}
function getLibsHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiTokenLibs}`
  };
}
function buildApiUrl(endpoint) {
  return `${config.apiBaseUrl}${endpoint}`;
}
function buildLibsUrl(endpoint) {
  return `${config.apiBaseUrlProfessions}${endpoint}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildApiUrl,
  buildLibsUrl,
  config,
  getApiHeaders,
  getLibsHeaders,
  setRuntimeConfig
});
