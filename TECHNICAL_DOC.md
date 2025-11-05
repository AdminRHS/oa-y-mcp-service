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
- `API_TOKEN_LIBS` — authorization token for libs API requests (professions data from libs.anyemp.com)

> **Note:** API_BASE_URL and API_BASE_URL_PROFESSIONS are hardcoded in the code and selected automatically based on APP_ENV. You do not need to provide them as environment variables.

**API Endpoints:**
- **Courses/Lessons**: `https://oa-y.com/api-tokens` (prod) / `https://lrn.oa-y.com/api-tokens` (dev)
- **Professions**: `https://libs.anyemp.com/api/token` (prod) / `https://libdev.anyemp.com/api/token` (dev)

---

## Data Schemas

- **Courses**: contain modules (with order), professions, tools, difficulty, duration, image, draft flag
- **Modules**: contain lessons (by id), achievements, description, duration, videoUrl, previewImage
- **Lessons**: support various types and content formats, may include content blocks, resources, exercises, tests (tests are attached to lessons!)
- **Tests**: attached to lessons (not modules), contain questions, passingScore, timeLimit
- **Professions**: list of professions, obtained via a separate request

**IMPORTANT**: Tests are attached to Lessons, not to Modules!

---

## MCP Tools

- `get_courses` — get a list of courses (with filters and pagination, supports profession filtering)
- `get_course` — get a course by id
- `create_course` — create a course (requires lesson IDs from create_lesson)
- `update_course` — update a course (requires lesson IDs from create_lesson)
- `get_lessons` — get a list of lessons
- `get_lesson` — get a lesson by id
- `create_lesson` — create a lesson (use this first to get lesson IDs)
- `update_lesson` — update a lesson
- `get_professions` — get all professions (returns array with name and ID)
- `get_skills` — get all skills (returns array with name and ID)
- `get_tools` — get all tools (returns array with name and ID)

> **Note:** All tools are available in both production and development modes. Production mode is recommended for all users, development mode is for testing only.

**Workflow:** Create lessons first using `create_lesson`, then use the returned lesson IDs in `create_course` or `update_course`.

---

## Course Filtering by Professions

The `get_courses` tool supports filtering courses by profession IDs. This feature allows users to retrieve courses specific to certain professions.

### Implementation Details:
- **Input Schema:** `professions` parameter accepts an array of numbers (profession IDs)
- **API Format:** Profession IDs are sent as comma-separated values: `professions=68,69`
- **Data Processing:** The system handles various input types (objects with `_id`, numbers, strings) and converts them to the required format

### Technical Flow:
1. User calls `get_professions` to get available profession IDs
2. User calls `get_courses` with `professions` parameter containing profession IDs
3. System converts profession IDs to comma-separated string format
4. API request is made with `professions=id1,id2` parameter
5. Backend returns filtered courses

### Supported Parameters:
- `professions` - Array of profession IDs (numbers)
- `difficulty` - Filter by difficulty level
- `search` - Search by course name or description
- `page` - Page number for pagination
- `limit` - Number of courses per page
- `all` - Get all courses without pagination

---

## API Interaction

- All API requests use the header `Authorization: Bearer <API_TOKEN>`
- POST/PUT requests are used for creating/updating courses and lessons
- GET requests are used for retrieving courses, lessons, and professions
- Production mode uses [https://oa-y.com](https://oa-y.com) endpoints
- Development mode uses [https://lrn.oa-y.com](https://lrn.oa-y.com) endpoints (for testing only)

---

## Server Startup

The server starts with the following configuration:

1. **Environment Validation**: Checks for required environment variables (`APP_ENV`, `API_TOKEN`, `API_TOKEN_LIBS`)
2. **API URL Selection**: Automatically selects URLs based on APP_ENV
3. **MCP Server Initialization**: Creates server with tool handlers
4. **Transport Setup**: Uses stdio transport for MCP communication

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables:
   ```bash
   export APP_ENV=prod
   export API_TOKEN=your_main_api_token
   export API_TOKEN_LIBS=your_libs_api_token
   ```
3. Start the server:
   ```bash
   node index.js
   ```
   The server will start and listen on stdio for MCP requests.

**For testing:** Use `APP_ENV=dev` for testing purposes.

## Configuration Schema

### Required Environment Variables
```bash
# Production mode (recommended)
export APP_ENV=prod
export API_TOKEN=your_main_api_token
export API_TOKEN_LIBS=your_libs_api_token

# Development mode (for testing)
export APP_ENV=dev
export API_TOKEN=your_main_api_token
export API_TOKEN_LIBS=your_libs_api_token
```

### MCP Configuration
```json
{
  "mcpServers": {
    "oa-y-mcp-service": {
      "command": "npx",
      "args": ["github:AdminRHS/oa-y-mcp-service"],
      "env": {
        "APP_ENV": "prod",
        "API_TOKEN": "your_main_api_token",
        "API_TOKEN_LIBS": "your_libs_api_token"
      }
    }
  }
}
```

---

## Example Requests (MCP tool call)

### Get Courses

```json
{
  "name": "get_courses",
  "arguments": { "page": 1, "limit": 10 }
}
```

### Get Courses by Professions

```json
{
  "name": "get_courses",
  "arguments": { 
    "professions": [68, 69],
    "difficulty": "beginner"
  }
}
```

### Create Lesson

```json
{
  "name": "create_lesson",
  "arguments": {
    "title": "Lesson Title",
    "type": "text",
    "contentType": "standard",
    "content": "Lesson content here",
    "duration": 30
  }
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
    "modules": [
      {
        "title": "Module 1",
        "content": "Module content",
        "order": 1,
        "lessons": ["lesson_id_from_create_lesson"]
      }
    ],
    "professions": [],
    "image": "",
    "duration": 60
  }
}
```

### Get Professions
**Always returns all professions with name and ID.**

```json
{
  "name": "get_professions",
  "arguments": {}
}
```

**Get Skills:**
**Always returns all skills with name and ID.**

```json
{
  "name": "get_skills",
  "arguments": {}
}
```

**Get Tools:**
**Always returns all tools with name and ID.**

```json
{
  "name": "get_tools",
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
    "difficulty": "intermediate",
    "modules": [
      {
        "title": "Updated Module",
        "content": "Updated module content",
        "order": 1,
        "lessons": ["existing_lesson_id", "new_lesson_id_from_create_lesson"]
      }
    ]
  }
}
```

---

## Error Handling

- All API errors are returned with the field `isError: true` and an error message
- On success, the result is returned in the `content` field (as a JSON string)

---
