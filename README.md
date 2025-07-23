# OA-Y MCP Service

A minimal MCP service for managing courses via HTTP API. Production mode only.

---

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables:
   - `APP_ENV=prod`
   - `API_TOKEN=your_token`
3. Start the service:
   ```bash
   node index.js
   ```

---

## How to get your API_TOKEN

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

- `login`, `create_or_update_course`, `get_courses`

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
