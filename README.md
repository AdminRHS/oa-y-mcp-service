# OA-Y MCP Service

A minimal MCP service for managing courses via HTTP API. 

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

## MCP Tools

- `login`, `create_or_update_course`, `get_courses`

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

## Quick Start (local)

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
