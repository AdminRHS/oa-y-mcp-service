# OA-Y MCP Service

MCP for managing courses via HTTP API at oa-y.com.

---

## Integration as MCP Server

This service supports **two transport protocols** for MCP integration: STDIO and StreamableHTTP.

### Mode 1: STDIO (Local/Command Line)

For local integration with Cursor, Claude Desktop, or other MCP clients:

```json
{
  "mcpServers": {
    "oa-y-mcp-service": {
      "command": "npx",
      "args": ["-y", "github:AdminRHS/oa-y-mcp-service"],
      "env": {
        "APP_ENV": "prod",
        "API_TOKEN": "your_token",
        "API_TOKEN_LIBS": "your_libs_token"
      }
    }
  }
}
```

### Mode 2: StreamableHTTP (Remote/HTTP)

For remote integration via StreamableHTTP:

```json
{
  "mcpServers": {
    "oa-y-remote": {
      "url": "http://your-server:3000/mcp?API_TOKEN=your_token&API_TOKEN_LIBS=your_libs_token&APP_ENV=prod"
    }
  }
}
```

**When to use each transport:**
- **STDIO (stdin/stdout, Desktop‑first)**: Ideal for Desktop apps and local IDE integrations (Cursor, Claude Desktop). 
- **StreamableHTTP (/mcp, Browser/Agents‑first)**: Best for AI agents and browser/cloud clients (including proxies/tunnels). 

### API_TOKEN

**How to get your API_TOKEN:**

1. Go to [https://oa-y.com](https://oa-y.com) and log in as an **admin**.
2. Open the **Admin Panel** and go to the **API Tokens** tab.
3. Click **Create Token**, enter a name, and create the token.
4. Copy the generated token and use it as the `API_TOKEN` environment variable.

### API_TOKEN_LIBS

**How to get your API_TOKEN_LIBS:**

1. Go to [https://libs.anyemp.com](https://libs.anyemp.com) and log in as an **admin**.
2. Open the **Admin Panel** and go to the **API Tokens** tab.
3. Click **Create Token**, enter a name (e.g., "Libs API"), and create the token.
4. Copy the generated token and use it as the `API_TOKEN_LIBS` environment variable.

### APP_ENV

Environment setting:
- `prod` - Production environment (default, uses oa-y.com and libs.anyemp.com)
- `dev` - Development/testing (uses lrn.oa-y.com and libdev.anyemp.com)

---

## Available MCP Tools

This section describes all available tools for managing courses, lessons, modules, tests, and professions.

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

### Creation Order

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

### Example Requests

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

### Course Filtering by Professions

The `get_courses` tool supports filtering courses by profession IDs:

**Workflow:**
1. Call `get_professions` to get all available professions with their IDs
2. Use profession IDs in `get_courses` with the `professions` parameter

**Parameters:**
- `professions` - Array of profession IDs (numbers)
- `difficulty` - Filter by difficulty: "beginner", "intermediate", "advanced"
- `search` - Search by course name or description
- `page` - Page number for pagination
- `limit` - Number of courses per page
- `all` - Get all courses without pagination

---

## Testing

This section describes how to test the MCP service in different modes.

### Testing Mode 1: STDIO (Local/Command Line)

**Prerequisites:**
- Node.js installed
- API tokens configured (see [API_TOKEN](#api_token) and [API_TOKEN_LIBS](#api_token_libs) sections)

**Steps:**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the bundled version:**
   ```bash
   npm run build
   ```
   This creates `oa-y-mcp-service.cjs` file that will be used by MCP clients.

3. **Configure your MCP client (Cursor/Claude Desktop):**

   Add to your MCP settings file:
   ```json
   {
     "mcpServers": {
       "oa-y-local": {
         "command": "node",
         "args": ["c:/Projects/RH/oa-y-mcp-service/oa-y-mcp-service.cjs"],
         "env": {
           "APP_ENV": "prod",
           "API_TOKEN": "your_token",
           "API_TOKEN_LIBS": "your_libs_token"
         }
       }
     }
   }
   ```

4. **Restart your MCP client** (Cursor/Claude Desktop)

5. **Test the tools:**
   - Try calling `get_professions` to verify connection
   - Try creating a lesson with `create_lesson`
   - Verify that all tools are available and working

**For development/debugging:**
```bash
npm run dev          # Run in STDIO mode
npm run dev:inspect  # Run with Node Inspector
```

### Testing Mode 2: StreamableHTTP (Remote/HTTP)

**Prerequisites:**
- Node.js installed
- API tokens configured (see [API_TOKEN](#api_token) and [API_TOKEN_LIBS](#api_token_libs) sections)

**Steps:**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the HTTP server:**
   ```bash
   npm start
   # or
   npm run http
   ```

3. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Configure your MCP client (Cursor/Claude Desktop):**

   Add to your MCP settings file:
   ```json
   {
     "mcpServers": {
       "oa-y-http": {
         "url": "http://localhost:3000/mcp?API_TOKEN=your_token&API_TOKEN_LIBS=your_libs_token&APP_ENV=prod"
       }
     }
   }
   ```

5. **Restart your MCP client** (Cursor/Claude Desktop)

6. **Test the tools:**
   - Try calling `get_professions` to verify connection
   - Try creating a lesson with `create_lesson`
   - Verify that all tools are available and working

**For development/debugging:**
```bash
npm run http:inspect  # Run HTTP server with Node Inspector
```

**Available HTTP endpoints:**
- `GET /mcp` — StreamableHTTP handshake/stream
- `POST /mcp` — MCP protocol endpoint
- `GET /health` — health check
- `GET /` — service information

**Testing with public URL (localtunnel):**

For testing with remote access:

1. **Install localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start your local server:**
   ```bash
   npm start
   ```

3. **Create a public tunnel:**
   ```bash
   lt --port 3000 --local-host localhost
   ```

4. **Use the provided URL in your MCP client:**
   ```json
   {
     "mcpServers": {
       "oa-y-remote": {
         "url": "https://random-subdomain.loca.lt/mcp?API_TOKEN=your_token&API_TOKEN_LIBS=your_libs_token&APP_ENV=prod"
       }
     }
   }
   ```

---

## Deployment

This section describes how to deploy the MCP service for production use.

### Deployment Mode 1: STDIO (NPM Package via GitHub)

This mode allows users to install your MCP service directly from GitHub using `npx`.

**Requirements:**
- Repository pushed to GitHub
- Built `oa-y-mcp-service.cjs` file committed to repository

**Deployment Steps:**

1. **Build the bundled version:**
   ```bash
   npm run build
   ```
   This creates `oa-y-mcp-service.cjs` — the bundled file that includes all dependencies.

2. **Commit and push to GitHub:**
   ```bash
   git add oa-y-mcp-service.cjs
   git commit -m "Build MCP service for distribution"
   git push origin main
   ```

3. **Users can now install via npx:**
   ```json
   {
     "mcpServers": {
       "oa-y-mcp-service": {
         "command": "npx",
         "args": ["github:AdminRHS/oa-y-mcp-service"],
         "env": {
           "APP_ENV": "prod",
           "API_TOKEN": "user_token",
           "API_TOKEN_LIBS": "user_libs_token"
         }
       }
     }
   }
   ```

**Important:**
- Always build before pushing: `npm run build`
- The built file `oa-y-mcp-service.cjs` must be committed to the repository
- Users will download and run this file via `npx`

### Deployment Mode 2: StreamableHTTP (Docker on Server)

This mode deploys the MCP service as an HTTP server using Docker.

**Requirements:**
- Docker and Docker Compose installed on server
- Server with public IP or domain name

**Deployment Steps:**

1. **On your server, clone the repository:**
   ```bash
   git clone https://github.com/AdminRHS/oa-y-mcp-service.git
   cd oa-y-mcp-service
   ```

2. **Create `.env` file (optional, for custom port):**
   ```bash
   PORT=3000
   ```

3. **Start the service with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Verify the service is running:**
   ```bash
   curl http://localhost:3000/health
   ```

5. **Users can now connect via HTTP:**
   ```json
   {
     "mcpServers": {
       "oa-y-remote": {
         "url": "http://your-server-ip:3000/mcp?API_TOKEN=user_token&API_TOKEN_LIBS=user_libs_token&APP_ENV=prod"
       }
     }
   }
   ```

**Docker Compose Configuration:**

The service uses [docker-compose.yml](docker-compose.yml) and [Dockerfile](Dockerfile):
- Builds image from Node.js Alpine
- Installs dependencies
- Exposes port 3000 (configurable via `.env`)
- Auto-restarts on failure

**Updating the Deployment:**

To update the service on the server:
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

**Monitoring:**

View logs:
```bash
docker-compose logs -f
```

Check container status:
```bash
docker-compose ps
```

**Production Recommendations:**
- Use a reverse proxy (nginx/traefik) for HTTPS
- Set up proper firewall rules
- Use environment-specific API tokens
- Configure monitoring and alerts
- Set up automated backups

---

## Response Format

All responses follow the MCP (Model Context Protocol) JSON-RPC 2.0 format. See [MCP documentation](https://modelcontextprotocol.io) for details.

---

## Available Scripts

- `npm run dev` - Run STDIO mode (local development)
- `npm run dev:inspect` - Run STDIO mode with Inspector
- `npm run http` - Run HTTP server mode
- `npm run http:inspect` - Run HTTP server with Inspector
- `npm start` - Start HTTP server (default)
- `npm run build` - Build bundled version (oa-y-mcp-service.cjs)

