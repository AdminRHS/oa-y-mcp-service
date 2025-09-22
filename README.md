# OA-Y MCP Service

A minimal MCP service for managing courses via HTTP API. 

---

## Integration as MCP Server

You can integrate this service as an external MCP server in your platform or AI system.

**Example configuration:**

```json
{
  "mcpServers": {
    "oa-y-mcp-service": {
      "command": "npx",
      "args": ["github:AdminRHS/oa-y-mcp-service"],
      "env": {
        "APP_ENV": "prod",
        "API_TOKEN": "your_token",
        "API_TOKEN_LIBS": "your_libs_token"
      }
    }
  }
}
```

---

## Environment Variables

### API_TOKEN
**Required.** Your authentication token for the OA-Y platform.

**How to get your API_TOKEN:**
1. Go to [https://oa-y.com](https://oa-y.com) and log in as an **admin**.
2. Open the **Admin Panel** and go to the **API Tokens** tab.
3. Click **Create Token**, enter a name, and create the token.
4. Copy the generated token and use it as the `API_TOKEN` environment variable.

### API_TOKEN_LIBS
**Required.** Your authentication token for the libs API (professions data from libs.anyemp.com).

**How to get your API_TOKEN_LIBS:**
1. Go to [https://libs.anyemp.com](https://libs.anyemp.com) and log in as an **admin**.
2. Open the **Admin Panel** and go to the **API Tokens** tab.
3. Click **Create Token**, enter a name (e.g., "Libs API"), and create the token.
4. Copy the generated token and use it as the `API_TOKEN_LIBS` environment variable.

### APP_ENV
**Required.** Sets the application environment.
- `prod` - Production environment (recommended for all users)
- `dev` - Development environment (for testing only)

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

---

## Example Requests

**Get Courses:**

```json
{
  "name": "get_courses",
  "arguments": { "page": 1, "limit": 10 }
}
```

**Get Courses by Professions:**

```json
{
  "name": "get_courses",
  "arguments": { 
    "professions": [68, 69],
    "difficulty": "beginner"
  }
}
```

**Create Lesson (first):**

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

**Create Course (with lesson IDs):**

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

**Get Professions:**

```json
{
  "name": "get_professions",
  "arguments": {}
}
```

**Update Course (with lesson IDs):**

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

## Course Filtering by Professions

The `get_courses` tool supports filtering courses by profession IDs. Here's how to use it:

### Workflow:
1. **Get Professions:** Call `get_professions` to get all available professions with their IDs
2. **Filter Courses:** Use profession IDs in `get_courses` with the `professions` parameter

### Example:
```json
{
  "name": "get_courses",
  "arguments": { 
    "professions": [68, 69],
    "difficulty": "beginner"
  }
}
```

### Parameters:
- `professions` - Array of profession IDs (numbers)
- `difficulty` - Filter by difficulty: "beginner", "intermediate", "advanced"
- `search` - Search by course name or description
- `page` - Page number for pagination
- `limit` - Number of courses per page
- `all` - Get all courses without pagination

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

## Notes

- `APP_ENV`, `API_TOKEN`, and `API_TOKEN_LIBS` are required.
- Production mode (`APP_ENV=prod`) is recommended for all users.
- Development mode (`APP_ENV=dev`) is for testing only.
- API URLs are automatically selected based on APP_ENV.
- Platform: [https://oa-y.com](https://oa-y.com)

---

## Local Development

### Quick Start (local)

1. **Build the project into a single file:**
   ```bash
   npm run build
   ```
   or directly:
   ```bash
   npx esbuild index.js --bundle --platform=node --outfile=oa-y-mcp-service.js --format=esm
   ```
2. **Run the service:**
   ```bash
   node oa-y-mcp-service.js
   ```
3. **Set the environment variables:**
   ```bash
   export API_TOKEN=your_token
   export API_TOKEN_LIBS=your_libs_token
   export APP_ENV=prod
   ```
   (on Windows: `set API_TOKEN=your_token`, `set API_TOKEN_LIBS=your_libs_token`, and `set APP_ENV=prod`)

### Quick Start (development)

**For testing:**

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables:
   - `APP_ENV=dev`
   - `API_TOKEN=your_token`
   - `API_TOKEN_LIBS=your_libs_token`
3. Start the service:
   ```bash
   node index.js
   ```

### Local Node Integration

**For local development:**

```json
{
  "mcpServers": {
    "oa-y-mcp-service": {
      "command": "node",
      "args": ["/path/to/oa-y-mcp-service/oa-y-mcp-service.js"],
      "env": {
        "APP_ENV": "prod",
        "API_TOKEN": "your_token",
        "API_TOKEN_LIBS": "your_libs_token"
      }
    }
  }
}
```
