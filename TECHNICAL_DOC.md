# Technical Documentation: oa-y-mcp-service

**Note:** This documentation covers both development (APP_ENV=dev) and production (APP_ENV=prod) modes for [https://lrn.oa-y.com](https://lrn.oa-y.com) (dev) and [https://oa-y.com](https://oa-y.com) (prod).

---

## Overview

`oa-y-mcp-service` is a Node.js server implementing the Model Context Protocol (MCP) for managing courses, modules, lessons, and professions via API. The server operates over standard input/output (stdio) and provides tools for interacting with the OA-Y platform through REST API.

---

## Architecture

- **index.js** — the main entry point, implements the MCP server and all tool handlers. Defines base API URLs depending on APP_ENV.
- **toolHandlers** — contains all tool handlers for both production and development modes.
- The server uses the same tool handlers for both modes, with API URLs selected based on the `APP_ENV` environment variable (`dev` or `prod`).
- Uses the following packages:
  - `@modelcontextprotocol/sdk/server` — for MCP server and stdio transport
  - `@modelcontextprotocol/sdk/types` — for tool request schemas

---

## Environment Variables

- `APP_ENV` — set to `prod` for production mode (recommended for all users), or `dev` for development mode (for testing only)
- `API_TOKEN` — authorization token for all requests

> **Note:** API_BASE_URL and API_BASE_URL_PROFESSIONS are hardcoded in the code and selected automatically based on APP_ENV. You do not need to provide them as environment variables.

---

## Data Schemas

- **Courses**: contain modules, professions, difficulty, duration, image, draft flag
- **Modules**: contain lessons (by id), tests, achievements, description, duration
- **Lessons**: support various types and content formats, may include content blocks, resources, exercises
- **Professions**: list of professions, obtained via a separate request

---

## MCP Tools

- `get_courses` — get a list of courses (with filters and pagination)
- `get_course` — get a course by id
- `create_course` — create a course (with lesson creation/update)
- `update_course` — update a course (with lesson creation/update)
- `get_lessons` — get a list of lessons
- `get_lesson` — get a lesson by id
- `create_lesson` — create a lesson
- `update_lesson` — update a lesson
- `get_professions` — get a list of professions

> **Note:** All tools are available in both production and development modes. Production mode is recommended for all users, development mode is for testing only.

---

## API Interaction

- All API requests use the header `Authorization: Bearer <API_TOKEN>`
- POST/PUT requests are used for creating/updating courses and lessons
- GET requests are used for retrieving courses, lessons, and professions
- Production mode uses [https://oa-y.com](https://oa-y.com) endpoints
- Development mode uses [https://lrn.oa-y.com](https://lrn.oa-y.com) endpoints (for testing only)

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

**For testing:** Use `APP_ENV=dev` for testing purposes.

---

## Example Requests (MCP tool call)

### Get Courses

```json
{
  "name": "get_courses",
  "arguments": { "page": 1, "limit": 10 }
}
```

### Create Course

```json
{
  "name": "create_course",
  "arguments": {
    "title": "Course Title",
    "description": "Course description",
    "difficulty": "beginner",
    "modules": [],
    "professions": [],
    "image": "",
    "duration": 60
  }
}
```

### Get Professions

```json
{
  "name": "get_professions",
  "arguments": {}
}
```

### Update Course

```json
{
  "name": "update_course",
  "arguments": {
    "courseId": "course_id_here",
    "title": "Updated Course Title",
    "description": "Updated course description",
    "difficulty": "intermediate"
  }
}
```

---

## Error Handling

- All API errors are returned with the field `isError: true` and an error message
- On success, the result is returned in the `content` field (as a JSON string)

---
