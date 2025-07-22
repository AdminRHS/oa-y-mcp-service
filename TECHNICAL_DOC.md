# Technical Documentation: oa-y-mcp-service

**Note:** This documentation covers both development (APP_ENV=dev) and production (APP_ENV=prod) modes for [https://lrn.oa-y.com](https://lrn.oa-y.com) (dev) and [https://oa-y.com](https://oa-y.com) (prod).

---

## Overview

`oa-y-mcp-service` is a Node.js server implementing the Model Context Protocol (MCP) for managing courses, modules, lessons, and professions via API. The server operates over standard input/output (stdio) and provides tools for interacting with external services through REST API.

---

## Architecture

- **index.js** — the main entry point, implements the MCP server and delegates tool calls. Also defines base API URLs depending on APP_ENV.
- **devToolHandlers.js** — contains all tool handlers for development mode (dev/new API).
- **prodToolHandlers.js** — contains tool handlers for production mode (prod API, currently only course creation/update, retrieval, and login).
- The server determines which set of tool handlers to use based on the `APP_ENV` environment variable (`dev` or `prod`).
- Uses the following packages:
  - `@modelcontextprotocol/sdk/server` — for MCP server and stdio transport
  - `@modelcontextprotocol/sdk/types` — for tool request schemas
  - `node-fetch` — for HTTP requests to external APIs

---

## Environment Variables

- `APP_ENV` — set to `dev` for development mode (new API, [https://lrn.oa-y.com](https://lrn.oa-y.com)), or `prod` for production mode ([https://oa-y.com](https://oa-y.com))
- `API_TOKEN` — authorization token for all requests

> **Note:** API_BASE_URL and API_BASE_URL_PROFESSIONS are hardcoded in the code and selected automatically based on APP_ENV. You do not need to provide them as environment variables.

---

## Data Schemas

- **Courses**: contain modules, professions, difficulty, duration, image, draft flag
- **Modules**: contain lessons (by id), tests, achievements, description, duration (dev only)
- **Lessons**: support various types and content formats, may include content blocks, resources, exercises (dev only)
- **Professions**: list of professions, obtained via a separate request (dev only)

---

## MCP Tools

### Development Mode (`APP_ENV=dev`, `devToolHandlers.js`)

- `get_courses` — get a list of courses (with filters and pagination)
- `get_course` — get a course by id
- `create_course` — create a course (with lesson creation/update)
- `update_course` — update a course (with lesson creation/update)
- `get_lessons` — get a list of lessons
- `get_lesson` — get a lesson by id
- `create_lesson` — create a lesson
- `update_lesson` — update a lesson
- `get_professions` — get a list of professions

### Production Mode (`APP_ENV=prod`, `prodToolHandlers.js`)

- `login` — authenticate and obtain a token for further requests (required before other actions)
- `create_or_update_course` — create or update a course
- `get_courses` — get a list of courses

> **Note:** In production, only course creation/update, retrieval, and login are supported. Other features (modules, lessons, professions) are available only in development mode. The production API uses the domain [https://oa-y.com](https://oa-y.com).

---

## API Interaction

- All API requests use the header `Authorization: Bearer <API_TOKEN>`
- POST/PUT requests are used for creating/updating courses
- GET requests are used for retrieving courses
- In prod mode, you must call `login` first to obtain a token for further requests
- In dev mode, additional endpoints and features are available (see above)
- In prod mode, only course endpoints are available (see `prodToolHandlers.js`)

---

## Server Startup

### Development Mode

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables (`APP_ENV=dev`, `API_TOKEN`)
3. Start the server:
   ```bash
   node index.js
   ```
   The server will start and listen on stdio for MCP requests.

### Production Mode

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables (`APP_ENV=prod`, `API_TOKEN`)
3. Start the server:
   ```bash
   node index.js
   ```
   The server will start and listen on stdio for MCP requests.

---

## Example Requests (MCP tool call)

### Login (prod)

```json
{
  "name": "login",
  "arguments": { "email": "user@example.com", "password": "your_password" }
}
```

### Get Courses (prod)

```json
{
  "name": "get_courses",
  "arguments": { "page": 1, "limit": 10 }
}
```

---

## Error Handling

- All API errors are returned with the field `isError: true` and an error message
- On success, the result is returned in the `content` field (as a JSON string)

---
