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

### Course Management

- `get_courses` — get a list of courses (with filters and pagination, supports profession filtering)
- `get_course` — get a course by id
- `create_course` — create a course (requires module IDs from create_module)
- `update_course` — update a course (requires module IDs from create_module)

### Lesson Management

- `get_lessons` — get a list of lessons
- `get_lesson` — get a lesson by id
- `create_lesson` — create a lesson (use this first to get lesson IDs)
- `update_lesson` — update a lesson

### Module Management

- `get_modules` — get a list of modules
- `get_module` — get a module by id
- `create_module` — create a module (requires lesson IDs from create_lesson)
- `update_module` — update a module (requires lesson IDs from create_lesson)

### Test Management

- `get_tests` — get a list of tests
- `get_test` — get a test by id
- `create_test` — create a test (requires module ID from create_module)
- `update_test` — update a test (requires module ID from create_module)

### Profession Management

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

**Create Module (with lesson IDs):**

```json
{
  "name": "create_module",
  "arguments": {
    "title": "Module Title",
    "content": "Module description (plain text)",
    "lessons": ["lesson_id_from_create_lesson"],
    "tests": ["test_id_from_create_test"]
  }
}
```

**Create Course (with module IDs):**

```json
{
  "name": "create_course",
  "arguments": {
    "title": "Course Title",
    "description": "Course description",
    "difficulty": "beginner",
    "modules": [
      {
        "module": "module_id_from_create_module",
        "order": 1
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

**Create Test (with module ID):**

```json
{
  "name": "create_test",
  "arguments": {
    "title": "Test Title",
    "description": "Test description",
    "module": "module_id_from_create_module",
    "questions": [
      {
        "question": "What is HTML?",
        "type": "single-choice",
        "options": [
          { "text": "HyperText Markup Language", "isCorrect": true },
          { "text": "High Tech Modern Language", "isCorrect": false }
        ],
        "points": 10
      }
    ],
    "passingScore": 70,
    "timeLimit": 30
  }
}
```

**Update Course (with module IDs):**

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
        "module": "existing_module_id",
        "order": 1
      },
      {
        "module": "new_module_id_from_create_module",
        "order": 2
      }
    ]
  }
}
```

---

## Creation Order

**IMPORTANT:** Follow the correct creation order for courses, modules, lessons, and tests:

1. **CREATE LESSONS FIRST:**

   - Use `create_lesson` to create individual lessons
   - Get lesson IDs from the response
   - For mixed content type, use contentBlocks array instead of content field

2. **CREATE TESTS (OPTIONAL):**

   - Use `create_test` to create tests
   - Get test IDs from the response

3. **CREATE MODULES:**

   - Use `create_module` with lesson IDs and test IDs
   - Get module IDs from the response

4. **CREATE COURSE WITH MODULES:**

   - Use `create_course` with module IDs in modules array
   - The system automatically generates slug, calculates duration, and sets default values

5. **UPDATE IF NEEDED:**
   - Use `update_*` functions for modifications
   - Follow the same order: lessons → tests → modules → courses

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
