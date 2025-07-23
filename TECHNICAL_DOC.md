# Technical Documentation: oa-y-mcp-service (Production)

**Note:** This documentation describes the production version of the service for [https://oa-y.com](https://oa-y.com).

---

## Overview

`oa-y-mcp-service` is a Node.js server implementing the Model Context Protocol (MCP) for managing courses via API. The server operates over standard input/output (stdio) and provides tools for interacting with the OA-Y production platform.

---

## Architecture

- **index.js** — the main entry point, implements the MCP server and delegates tool calls. Defines base API URLs for production.
- **prodToolHandlers.js** — contains tool handlers for production mode (course creation/update, retrieval, and login).
- Uses the following packages:
  - `@modelcontextprotocol/sdk/server` — for MCP server and stdio transport
  - `@modelcontextprotocol/sdk/types` — for tool request schemas
  - `node-fetch` — for HTTP requests to external APIs

---

## Environment Variables

- `APP_ENV=prod`
- `API_TOKEN` — authorization token for all requests

> **Note:** API_BASE_URL is hardcoded for production. You do not need to provide it as an environment variable.

---

## MCP Tools

- `login` — authenticate and obtain a token for further requests (required before other actions)
- `create_or_update_course` — create or update a course
- `get_courses` — get a list of courses

---

## API Interaction

- All API requests use the header `Authorization: Bearer <API_TOKEN>`
- POST/PUT requests are used for creating/updating courses
- GET requests are used for retrieving courses
- You must call `login` first to obtain a token for further requests

---

## Server Startup

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

## Example Requests

**Login:**

```json
{
  "name": "login",
  "arguments": { "email": "user@example.com", "password": "your_password" }
}
```

**Create or Update Course:**

```json
{
  "name": "create_or_update_course",
  "arguments": {
    "title": "Course Title",
    "description": "Course description",
    "category": "General",
    "difficulty": "beginner",
    "modules": [],
    "image": "",
    "duration": 60
  }
}
```

---

## Notes

- Only `APP_ENV=prod` and `API_TOKEN` are required.
- API URLs are hardcoded for production.
- Platform: [https://oa-y.com](https://oa-y.com)

---
