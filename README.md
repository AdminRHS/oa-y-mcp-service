# OA-Y MCP Service

A minimal MCP service for managing courses via HTTP API. Supports OA-Y production and development platforms.

---

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables:
   - `APP_ENV=prod` or `APP_ENV=dev`
   - `API_TOKEN=your_token`
3. Start the service:
   ```bash
   node index.js
   ```

---

## How to get your API_TOKEN (Production)

1. Go to [https://oa-y.com](https://oa-y.com) and log in as an **admin**.
2. Open the **Admin Panel** and go to the **API Tokens** tab.
3. Click **Create Token**, enter a name, and click **Create Token**.
4. Copy the generated token and set it as your `API_TOKEN` environment variable.

---

## Integration as MCP Server

You can integrate this service as an external MCP server in your platform or AI system.

**Example configuration (local node):**

```json
{
  "mcpServers": {
    "oa-y-mcp-service": {
      "command": "node",
      "args": ["/path/to/oa-y-mcp-service/index.js"],
      "env": {
        "APP_ENV": "prod",
        "API_TOKEN": "your_token"
      }
    }
  }
}
```

**Example configuration (npx from GitHub):**

```json
{
  "mcpServers": {
    "oa-y-mcp-service": {
      "command": "npx",
      "args": ["github:AdminRHS/oa-y-mcp-service"],
      "env": {
        "APP_ENV": "prod",
        "API_TOKEN": "your_token"
      }
    }
  }
}
```

---

## MCP Tools

- **prod:** `login`, `create_or_update_course`, `get_courses`
- **dev:** `get_courses`, `get_course`, `create_course`, `update_course`, `get_lessons`, `get_lesson`, `create_lesson`, `update_lesson`, `get_professions`

---

## Example Requests

**Login (prod):**

```json
{
  "name": "login",
  "arguments": { "email": "user@example.com", "password": "your_password" }
}
```

**Create Course (dev):**

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

---

## Notes

- Only `APP_ENV` and `API_TOKEN` are required.
- API URLs are hardcoded for each mode.
- Prod: [https://oa-y.com](https://oa-y.com) | Dev: [https://lrn.oa-y.com](https://lrn.oa-y.com)
