# Technical Documentation: oa-y-mcp-service (Production)

**Note:** This documentation describes the production version of the service for [https://oa-y.com](https://oa-y.com).

---

## Overview

`oa-y-mcp-service` is a Node.js server implementing the Model Context Protocol (MCP) for managing courses via API. The server operates over standard input/output (stdio) and provides tools for interacting with the OA-Y production platform.

---

## Architecture

- **index.js** — the main entry point, implements the MCP server and all tool logic. Defines base API URLs for production and uses only built-in Node.js modules and global fetch (Node.js 18+).
- Uses the following packages:
  - `@modelcontextprotocol/sdk/server` — for MCP server and stdio transport
  - `@modelcontextprotocol/sdk/types` — for tool request schemas

---

## Environment Variables

- `API_TOKEN` — authorization token for all requests

> **Note:** API_BASE_URL is hardcoded for production. You do not need to provide it as an environment variable.

---

## MCP Tools

- `login` — authenticate and obtain a token for further requests (required before other actions)
- `create_or_update_course` — create or update a course
- `get_courses` — get a list of courses

---

## Course and Lesson URL Format

To get a direct link to a course or lesson on the OA-Y platform, use the following formats:

- **Course:**
  ```
  https://oa-y.com/courses/<course._id>
  ```
- **Lesson:**
  ```
  https://oa-y.com/courses/<course._id>/modules/<module._id>/lessons/<lesson._id>
  ```

**Example:**

```
https://oa-y.com/courses/681230548967b4c2d5ba1e9b/modules/680114ed65861c900d25fd59/lessons/680114ed65861c900d25fd5a
```

---

## API Interaction

- All API requests use the header `Authorization: Bearer <API_TOKEN>`
- POST/PUT requests are used for creating/updating courses
- GET requests are used for retrieving courses
- You must call `login` first to obtain a token for further requests

---

## Integration as MCP Server

You can integrate this service as an external MCP server in your platform or AI system. Example configuration:

```json
{
  "mcpServers": {
    "oa-y-mcp-service": {
      "command": "npx",
      "args": ["github:AdminRHS/oa-y-mcp-service"],
      "env": {
        "API_TOKEN": "your_token"
      }
    }
  }
}
```

---

## How to get your API_TOKEN

1. Go to [https://oa-y.com](https://oa-y.com) and log in as an **admin**.
2. Open the **Admin Panel** and go to the **API Tokens** tab.
3. Click **Create Token**, enter a name, and create the token.
4. Copy the generated token and use it as the `API_TOKEN` environment variable.

---

## Build and Local Run

1. **Build the project into a single file:**
   ```bash
   npx esbuild index.js --bundle --platform=node --outfile=oa-y-mcp-service.js --format=esm
   ```
2. **Run the service:**
   ```bash
   node oa-y-mcp-service.js
   ```
3. **Set the environment variable:**
   ```bash
   export API_TOKEN=your_token
   ```
   (on Windows: `set API_TOKEN=your_token`)

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

- For local run, you only need the `oa-y-mcp-service.js` file and Node.js 18+.
- You can also run via npx github:AdminRHS/oa-y-mcp-service with no dependencies.
- Only `API_TOKEN` is required.
- Platform: [https://oa-y.com](https://oa-y.com)

---
