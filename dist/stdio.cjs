#!/usr/bin/env node

// src/transports/stdio.js
var import_server = require("@modelcontextprotocol/sdk/server/index.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_types = require("@modelcontextprotocol/sdk/types.js");

// src/core/schemas.js
var lessonBaseSchema = {
  title: { type: "string", description: "Lesson title (required, automatically generates slug)" },
  content: { type: "string", description: 'Main lesson content (HTML/Markdown, required if contentType !== "mixed")' },
  duration: { type: "number", description: "Lesson duration in minutes (optional, default: 0)" },
  type: { type: "string", enum: ["text", "video", "interactive"], description: "Lesson type (optional)" },
  contentType: {
    type: "string",
    enum: ["standard", "labyrinth", "flippingCards", "mixed", "memoryGame", "tagCloud", "rolePlayGame", "textReconstruction", "presentation", "fullHtml", "htmlBlock", "video"],
    description: "Content type (optional)"
  },
  professions: {
    type: "array",
    items: { type: "string" },
    description: "Array of profession IDs from libservice (optional, can be empty array)",
    default: []
  },
  contentBlocks: {
    type: "array",
    description: 'Content blocks (required if contentType === "mixed")',
    items: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["standard", "labyrinth", "flippingCards", "mixed", "memoryGame", "tagCloud", "rolePlayGame", "textReconstruction", "presentation", "fullHtml", "htmlBlock", "video"]
        },
        content: { type: "string", description: "JSON string for complex content types" },
        order: { type: "number", description: "Order of the block" }
      },
      required: ["type", "content", "order"]
    }
  },
  videoUrl: { type: "string", description: "Video URL (for video type lessons)" },
  resources: {
    type: "array",
    description: "Additional resources",
    items: {
      type: "object",
      properties: {
        title: { type: "string" },
        type: { type: "string" },
        description: { type: "string" },
        url: { type: "string" }
      },
      required: ["title", "type", "description", "url"]
    }
  },
  practiceExercises: {
    type: "array",
    description: "Practice exercises",
    items: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        codeSnippet: { type: "string" },
        playgroundUrl: { type: "string" }
      },
      required: ["title", "description"]
    }
  },
  isDraft: { type: "boolean", description: "Is draft (optional, default: true)" }
};
var courseModuleSchema = {
  type: "object",
  properties: {
    module: { type: "string", description: "Module ID (required)" },
    order: { type: "number", description: "Order of module in course (required)" }
  },
  required: ["module", "order"]
};
var courseBaseSchema = {
  title: { type: "string", description: "Course title (required, automatically generates slug)" },
  description: { type: "string", description: "Course description (required)" },
  image: { type: "string", description: "Path to course image (optional, default standard image)" },
  videos: {
    type: "array",
    items: { type: "string" },
    description: "Array of video URLs (optional)",
    default: []
  },
  modules: {
    type: "array",
    description: "Course modules with lesson IDs (create lessons first, then add their IDs to modules)",
    default: [],
    items: courseModuleSchema
  },
  professions: {
    type: "array",
    items: { type: "string" },
    description: "Array of profession IDs from microservice (optional, can be empty array)",
    default: []
  },
  difficulty: {
    type: "string",
    enum: ["beginner", "intermediate", "advanced"],
    description: "Difficulty level (required)"
  },
  isDraft: { type: "boolean", description: "Is draft (optional, default: true)" }
};
var moduleBaseSchema = {
  title: { type: "string", description: "Module title (required, automatically generates slug)" },
  content: { type: "string", description: "Module description (required, plain text)" },
  description: { type: "string", description: "Module description (optional)" },
  lessons: {
    type: "array",
    items: { type: "string" },
    description: "Array of lesson IDs (can be empty array)",
    default: []
  },
  tests: {
    type: "array",
    items: { type: "string" },
    description: "Array of test IDs (can be empty array)",
    default: []
  },
  isDraft: { type: "boolean", description: "Is draft (optional, default: true)" }
};
var testBaseSchema = {
  title: { type: "string", description: "Test title (required, automatically generates slug)" },
  description: { type: "string", description: "Test description (optional)" },
  module: { type: "string", description: "Module ID (required)" },
  questions: {
    type: "array",
    items: {
      oneOf: [
        // Single Choice
        {
          type: "object",
          properties: {
            question: { type: "string", description: "Question text" },
            type: { type: "string", enum: ["single-choice"] },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  isCorrect: { type: "boolean" }
                },
                required: ["text", "isCorrect"]
              }
            },
            points: { type: "number", description: "Points for this question", default: 1 }
          },
          required: ["question", "type", "options", "points"]
        },
        // Multiple Choice
        {
          type: "object",
          properties: {
            question: { type: "string", description: "Question text" },
            type: { type: "string", enum: ["multiple-choice"] },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  isCorrect: { type: "boolean" }
                },
                required: ["text", "isCorrect"]
              }
            },
            points: { type: "number", description: "Points for this question", default: 1 }
          },
          required: ["question", "type", "options", "points"]
        },
        // True-False
        {
          type: "object",
          properties: {
            question: { type: "string", description: "Question text" },
            type: { type: "string", enum: ["true-false"] },
            options: { type: "array", items: {}, description: "Empty array for true-false" },
            correctAnswer: { type: "string", enum: ["true", "false"], description: "Correct answer" },
            points: { type: "number", description: "Points for this question", default: 1 }
          },
          required: ["question", "type", "options", "correctAnswer", "points"]
        },
        // Text
        {
          type: "object",
          properties: {
            question: { type: "string", description: "Question text" },
            type: { type: "string", enum: ["text"] },
            options: { type: "array", items: {}, description: "Empty array for text" },
            correctAnswer: { type: "string", description: "Correct answer text" },
            points: { type: "number", description: "Points for this question", default: 1 }
          },
          required: ["question", "type", "options", "correctAnswer", "points"]
        },
        // Memory
        {
          type: "object",
          properties: {
            question: { type: "string", description: "Question text" },
            type: { type: "string", enum: ["memory"] },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  pairId: { type: "string", description: "Pair ID for matching" }
                },
                required: ["text", "pairId"]
              }
            },
            points: { type: "number", description: "Points for this question", default: 1 }
          },
          required: ["question", "type", "options", "points"]
        }
      ]
    },
    description: "Array of test questions"
  },
  passingScore: {
    type: "number",
    description: "Minimum score to pass (0-100)",
    minimum: 0,
    maximum: 100
  },
  timeLimit: {
    type: "number",
    description: "Time limit in minutes (optional)",
    default: 30
  }
};
var getCoursesInputSchema = {
  type: "object",
  properties: {
    page: { type: "number", description: "Page number (default: 1)" },
    limit: { type: "number", description: "Number of courses per page (default: 10)" },
    search: { type: "string", description: "Search by course name or description" },
    difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"], description: "Filter by difficulty level" },
    professions: {
      type: "array",
      items: { type: "number" },
      description: "Array of profession IDs to filter courses (must be obtained via get_professions tool call)"
    },
    all: { type: "boolean", description: "Get all courses without pagination" }
  }
};
var getCourseInputSchema = {
  type: "object",
  properties: {
    courseId: { type: "string", description: "Course ID" }
  },
  required: ["courseId"]
};
var createCourseInputSchema = {
  type: "object",
  properties: {
    ...courseBaseSchema
  },
  required: ["title", "description", "difficulty"],
  description: "Create a new course. IMPORTANT: Follow the correct creation order: 1) Create lessons using create_lesson, 2) Create tests using create_test (optional), 3) Create modules using create_module with lesson/test IDs, 4) Create course with module IDs in modules array. The system automatically generates slug, calculates duration, and sets default values."
};
var updateCourseInputSchema = {
  type: "object",
  properties: {
    courseId: { type: "string", description: "Course ID for update" },
    ...courseBaseSchema
  },
  required: ["courseId", "title", "description", "difficulty"],
  description: "Update an existing course. IMPORTANT: For new content, follow the correct order: 1) Create lessons using create_lesson, 2) Create tests using create_test (optional), 3) Create modules using create_module with lesson/test IDs, 4) Update course with new module IDs in modules array."
};
var getLessonsInputSchema = {
  type: "object",
  properties: {
    page: { type: "number", description: "Page number (default: 1)" },
    limit: { type: "number", description: "Number of lessons per page (default: 10)" },
    search: { type: "string", description: "Search by lesson title or description" },
    type: { type: "string", enum: ["text", "video", "interactive"], description: "Filter by lesson type" },
    contentType: { type: "string", description: "Filter by content type" },
    professions: {
      type: "array",
      items: { type: "string" },
      description: "Array of profession IDs to filter lessons (must be obtained via get_professions tool call)"
    },
    all: { type: "boolean", description: "Get all lessons without pagination" }
  }
};
var getLessonInputSchema = {
  type: "object",
  properties: {
    courseId: { type: "string", description: "Course ID" },
    moduleId: { type: "string", description: "Module ID" },
    lessonId: { type: "string", description: "Lesson ID" }
  },
  required: ["courseId", "moduleId", "lessonId"]
};
var createLessonInputSchema = {
  type: "object",
  properties: {
    ...lessonBaseSchema
  },
  required: ["title", "type", "contentType"],
  description: "Create a new lesson. IMPORTANT: Use this FIRST before creating courses. The system automatically generates slug and sets default values. For mixed content type, use contentBlocks array instead of content field."
};
var updateLessonInputSchema = {
  type: "object",
  properties: {
    lessonId: { type: "string", description: "Lesson ID for update" },
    ...lessonBaseSchema
  },
  required: ["lessonId", "title", "type", "contentType"],
  description: "Update an existing lesson. For mixed content type, use contentBlocks array instead of content field."
};
var getModulesInputSchema = {
  type: "object",
  properties: {
    page: { type: "number", description: "Page number (default: 1)" },
    limit: { type: "number", description: "Number of modules per page (default: 10)" },
    search: { type: "string", description: "Search by module title or description" }
  },
  description: "Get a list of modules with pagination and search"
};
var getModuleInputSchema = {
  type: "object",
  properties: {
    moduleId: { type: "string", description: "Module ID" }
  },
  required: ["moduleId"],
  description: "Get a specific module by ID"
};
var createModuleInputSchema = {
  type: "object",
  properties: {
    ...moduleBaseSchema
  },
  required: ["title", "content"],
  description: "Create a new module. IMPORTANT: Create lessons first, then add their IDs to the lessons array. The system automatically generates slug and sets default values."
};
var updateModuleInputSchema = {
  type: "object",
  properties: {
    moduleId: { type: "string", description: "Module ID for update" },
    ...moduleBaseSchema
  },
  required: ["moduleId", "title", "content"],
  description: "Update an existing module. For new lessons, create them first and add their IDs to the lessons array."
};
var getTestsInputSchema = {
  type: "object",
  properties: {
    page: { type: "number", description: "Page number (default: 1)" },
    limit: { type: "number", description: "Number of tests per page (default: 10)" },
    search: { type: "string", description: "Search by test title or description" }
  },
  description: "Get a list of tests with pagination and search"
};
var getTestInputSchema = {
  type: "object",
  properties: {
    testId: { type: "string", description: "Test ID" }
  },
  required: ["testId"],
  description: "Get a specific test by ID"
};
var createTestInputSchema = {
  type: "object",
  properties: {
    ...testBaseSchema
  },
  required: ["title", "module", "questions"],
  description: "Create a new test. IMPORTANT: Create modules first using create_module tool. The system automatically generates slug and sets default values."
};
var updateTestInputSchema = {
  type: "object",
  properties: {
    testId: { type: "string", description: "Test ID for update" },
    ...testBaseSchema
  },
  required: ["testId", "title", "module", "questions"],
  description: "Update an existing test. IMPORTANT: For new tests, create modules first using create_module tool."
};
var getProfessionsInputSchema = {
  type: "object",
  properties: {},
  description: "Get all professions without pagination"
};
var toolDefinitions = [
  { name: "get_courses", inputSchema: getCoursesInputSchema },
  { name: "get_course", inputSchema: getCourseInputSchema },
  { name: "create_course", inputSchema: createCourseInputSchema },
  { name: "update_course", inputSchema: updateCourseInputSchema },
  { name: "get_lessons", inputSchema: getLessonsInputSchema },
  { name: "get_lesson", inputSchema: getLessonInputSchema },
  { name: "create_lesson", inputSchema: createLessonInputSchema },
  { name: "update_lesson", inputSchema: updateLessonInputSchema },
  { name: "get_professions", inputSchema: getProfessionsInputSchema },
  { name: "get_modules", inputSchema: getModulesInputSchema },
  { name: "get_module", inputSchema: getModuleInputSchema },
  { name: "create_module", inputSchema: createModuleInputSchema },
  { name: "update_module", inputSchema: updateModuleInputSchema },
  { name: "get_tests", inputSchema: getTestsInputSchema },
  { name: "get_test", inputSchema: getTestInputSchema },
  { name: "create_test", inputSchema: createTestInputSchema },
  { name: "update_test", inputSchema: updateTestInputSchema }
];

// src/core/config.js
var import_config = require("dotenv/config");
function normalizeAppEnv(value) {
  return value === "dev" || value === "prod" ? value : "prod";
}
var config = {
  // Environment
  env: normalizeAppEnv(process.env.APP_ENV || "prod"),
  get isDev() {
    return this.env === "dev";
  },
  get isProd() {
    return this.env === "prod";
  },
  // Tokens
  apiToken: process.env.API_TOKEN,
  apiTokenLibs: process.env.API_TOKEN_LIBS,
  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  // API URLs
  apiBaseUrl: (process.env.APP_ENV || "prod") === "dev" ? "https://lrn.oa-y.com/api-tokens" : "https://oa-y.com/api-tokens",
  apiBaseUrlProfessions: (process.env.APP_ENV || "prod") === "dev" ? "https://libdev.anyemp.com/api/token" : "https://libs.anyemp.com/api/token"
};
function getApiHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiToken}`
  };
}
function getLibsHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiTokenLibs}`
  };
}
function buildApiUrl(endpoint) {
  return `${config.apiBaseUrl}${endpoint}`;
}
function buildLibsUrl(endpoint) {
  return `${config.apiBaseUrlProfessions}${endpoint}`;
}

// src/core/handlers.js
function buildUrlWithParams(endpoint, params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== void 0 && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(","));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}
function processProfessions(professions) {
  if (!Array.isArray(professions)) return [];
  return professions.map((p) => {
    if (typeof p === "object" && p._id) return p._id;
    if (typeof p === "number") return p.toString();
    if (typeof p === "string") return p;
    return p;
  }).filter(Boolean);
}
var toolHandlers = {
  /**
   * Get courses with pagination and filters
   */
  async get_courses(args) {
    const params = {};
    if (args.page) params.page = args.page;
    if (args.limit) params.limit = args.limit;
    if (args.search) params.search = args.search;
    if (args.difficulty) params.difficulty = args.difficulty;
    if (args.all) params.all = "true";
    if (args.professions && Array.isArray(args.professions)) {
      const professionIds = processProfessions(args.professions);
      if (professionIds.length > 0) {
        params.professions = professionIds;
      }
    }
    const url = buildUrlWithParams(buildApiUrl("/courses"), params);
    const response = await fetch(url, { headers: getApiHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Get a specific course by ID
   */
  async get_course(args) {
    const url = buildApiUrl(`/courses/${args.courseId}`);
    const response = await fetch(url, { headers: getApiHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Create a new course
   */
  async create_course(args) {
    let professions = processProfessions(args.professions || []);
    const modules = [];
    if (Array.isArray(args.modules)) {
      for (const mod of args.modules) {
        if (!mod.module || typeof mod.module !== "string") {
          throw new Error("Module ID is required and must be a string. Create modules first using create_module tool.");
        }
        if (typeof mod.order !== "number") {
          throw new Error("Module order is required and must be a number.");
        }
        modules.push({
          module: mod.module,
          order: mod.order
        });
      }
    }
    const courseData = {
      title: args.title,
      description: args.description,
      difficulty: args.difficulty,
      duration: args.duration,
      professions,
      image: args.image,
      isDraft: args.isDraft || false,
      modules
    };
    const url = buildApiUrl("/courses");
    const response = await fetch(url, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(courseData)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Update an existing course
   */
  async update_course(args) {
    let professions = processProfessions(args.professions || []);
    const courseId = args.courseId;
    const currentUrl = buildApiUrl(`/courses/${courseId}`);
    const currentCourseResponse = await fetch(currentUrl, { headers: getApiHeaders() });
    if (!currentCourseResponse.ok) {
      throw new Error(`Failed to get current course: HTTP ${currentCourseResponse.status}`);
    }
    const currentCourse = await currentCourseResponse.json();
    const courseData = { _id: courseId, ...args, professions };
    delete courseData.courseId;
    if (!courseData.modules && currentCourse.data?.modules) {
      courseData.modules = currentCourse.data.modules.map((module2) => ({
        module: module2.id,
        order: module2.order || 1
      }));
    }
    if (Array.isArray(courseData.modules)) {
      for (const mod of courseData.modules) {
        if (!mod.module || typeof mod.module !== "string") {
          throw new Error("Module ID is required and must be a string. Create modules first using create_module tool.");
        }
        if (typeof mod.order !== "number") {
          throw new Error("Module order is required and must be a number.");
        }
      }
    }
    const url = buildApiUrl(`/courses/${courseId}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: getApiHeaders(),
      body: JSON.stringify(courseData)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Get lessons with pagination and filters
   */
  async get_lessons(args) {
    const params = {};
    if (args.page) params.page = args.page;
    if (args.limit) params.limit = args.limit;
    if (args.search) params.search = args.search;
    if (args.type) params.type = args.type;
    if (args.contentType) params.contentType = args.contentType;
    if (args.courseId) params.courseId = args.courseId;
    if (args.moduleId) params.moduleId = args.moduleId;
    if (args.sortBy) params.sortBy = args.sortBy;
    if (args.all) params.all = "true";
    if (args.professions && Array.isArray(args.professions)) {
      const professionIds = processProfessions(args.professions);
      if (professionIds.length > 0) {
        params.professions = professionIds;
      }
    }
    const url = buildUrlWithParams(buildApiUrl("/lessons"), params);
    const response = await fetch(url, { headers: getApiHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Get a specific lesson by ID
   */
  async get_lesson(args) {
    const url = buildApiUrl(`/lessons/${args.lessonId}`);
    const response = await fetch(url, { headers: getApiHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Create a new lesson
   */
  async create_lesson(args) {
    let professions = processProfessions(args.professions || []);
    const lessonData = { ...args, professions };
    const url = buildApiUrl("/lessons");
    const response = await fetch(url, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(lessonData)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Update an existing lesson
   */
  async update_lesson(args) {
    const lessonId = args.lessonId || args._id;
    if (!lessonId) throw new Error("lessonId is required");
    const currentUrl = buildApiUrl(`/lessons/${lessonId}`);
    const currentLessonResponse = await fetch(currentUrl, { headers: getApiHeaders() });
    if (!currentLessonResponse.ok) {
      throw new Error(`Failed to get current lesson: HTTP ${currentLessonResponse.status}`);
    }
    const currentLesson = await currentLessonResponse.json();
    let professions = processProfessions(args.professions || []);
    const lessonData = { ...args, professions };
    delete lessonData.lessonId;
    if (!lessonData.module && currentLesson.data?.module) {
      lessonData.module = currentLesson.data.module;
    }
    const url = buildApiUrl(`/lessons/${lessonId}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: getApiHeaders(),
      body: JSON.stringify(lessonData)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Get all professions
   */
  async get_professions(args) {
    const url = buildLibsUrl("/professions?all=true&isShort=true");
    const response = await fetch(url, { headers: getLibsHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Get modules with pagination
   */
  async get_modules(args) {
    const params = {};
    if (args.page) params.page = args.page;
    if (args.limit) params.limit = args.limit;
    if (args.search) params.search = args.search;
    const url = buildUrlWithParams(buildApiUrl("/modules"), params);
    const response = await fetch(url, { headers: getApiHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Get a specific module by ID
   */
  async get_module(args) {
    const url = buildApiUrl(`/modules/${args.moduleId}`);
    const response = await fetch(url, { headers: getApiHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Create a new module
   */
  async create_module(args) {
    const moduleData = { ...args };
    const url = buildApiUrl("/modules");
    const response = await fetch(url, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(moduleData)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Update an existing module
   */
  async update_module(args) {
    const moduleId = args.moduleId || args._id;
    if (!moduleId) throw new Error("moduleId is required");
    const currentUrl = buildApiUrl(`/modules/${moduleId}`);
    const currentModuleResponse = await fetch(currentUrl, { headers: getApiHeaders() });
    if (!currentModuleResponse.ok) {
      throw new Error(`Failed to get current module: HTTP ${currentModuleResponse.status}`);
    }
    const currentModule = await currentModuleResponse.json();
    const moduleData = { ...args };
    delete moduleData.moduleId;
    if (!moduleData.lessons && currentModule.data?.lessons) {
      moduleData.lessons = currentModule.data.lessons.map((lesson) => lesson.id);
    }
    if (!moduleData.tests && currentModule.data?.tests) {
      moduleData.tests = currentModule.data.tests.map((test) => test.id);
    }
    const url = buildApiUrl(`/modules/${moduleId}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: getApiHeaders(),
      body: JSON.stringify(moduleData)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Get tests with pagination
   */
  async get_tests(args) {
    const params = {};
    if (args.page) params.page = args.page;
    if (args.limit) params.limit = args.limit;
    if (args.search) params.search = args.search;
    const url = buildUrlWithParams(buildApiUrl("/tests"), params);
    const response = await fetch(url, { headers: getApiHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Get a specific test by ID
   */
  async get_test(args) {
    const url = buildApiUrl(`/tests/${args.testId}`);
    const response = await fetch(url, { headers: getApiHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Create a new test
   */
  async create_test(args) {
    const testData = { ...args };
    const url = buildApiUrl("/tests");
    const response = await fetch(url, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(testData)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  /**
   * Update an existing test
   */
  async update_test(args) {
    const testId = args.testId || args._id;
    if (!testId) throw new Error("testId is required");
    const currentUrl = buildApiUrl(`/tests/${testId}`);
    const currentTestResponse = await fetch(currentUrl, { headers: getApiHeaders() });
    if (!currentTestResponse.ok) {
      throw new Error(`Failed to get current test: HTTP ${currentTestResponse.status}`);
    }
    const currentTest = await currentTestResponse.json();
    const testData = { ...args };
    delete testData.testId;
    if (!testData.module && currentTest.data?.module) {
      testData.module = currentTest.data.module;
    }
    const url = buildApiUrl(`/tests/${testId}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: getApiHeaders(),
      body: JSON.stringify(testData)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }
};
var mcpToolHandlers = {};
Object.keys(toolHandlers).forEach((toolName) => {
  mcpToolHandlers[toolName] = async (args) => {
    const result = await toolHandlers[toolName](args);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  };
});

// src/transports/stdio.js
var server = new import_server.Server({
  name: "oa-y-mcp-service",
  version: "2.0.0"
}, {
  capabilities: {
    tools: {}
  }
});
server.setRequestHandler(import_types.ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions
  };
});
server.setRequestHandler(import_types.CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (!mcpToolHandlers[name]) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true
    };
  }
  try {
    return await mcpToolHandlers[name](args || {});
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error executing ${name}: ${error.message}` }],
      isError: true
    };
  }
});
async function main() {
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
}
main().catch((error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});
