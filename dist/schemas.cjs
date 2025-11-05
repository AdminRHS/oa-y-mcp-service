var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core/schemas.js
var schemas_exports = {};
__export(schemas_exports, {
  createCourseInputSchema: () => createCourseInputSchema,
  createLessonInputSchema: () => createLessonInputSchema,
  createModuleInputSchema: () => createModuleInputSchema,
  createTestInputSchema: () => createTestInputSchema,
  getCourseInputSchema: () => getCourseInputSchema,
  getCoursesInputSchema: () => getCoursesInputSchema,
  getLessonInputSchema: () => getLessonInputSchema,
  getLessonsInputSchema: () => getLessonsInputSchema,
  getModuleInputSchema: () => getModuleInputSchema,
  getModulesInputSchema: () => getModulesInputSchema,
  getProfessionsInputSchema: () => getProfessionsInputSchema,
  getTestInputSchema: () => getTestInputSchema,
  getTestsInputSchema: () => getTestsInputSchema,
  getToolsInputSchema: () => getToolsInputSchema,
  toolDefinitions: () => toolDefinitions,
  updateCourseInputSchema: () => updateCourseInputSchema,
  updateLessonInputSchema: () => updateLessonInputSchema,
  updateModuleInputSchema: () => updateModuleInputSchema,
  updateTestInputSchema: () => updateTestInputSchema
});
module.exports = __toCommonJS(schemas_exports);
var lessonBaseSchema = {
  title: { type: "string", description: "Lesson title (required, automatically generates slug)" },
  description: { type: "string", description: "Lesson description (optional)" },
  content: { type: "string", description: 'Main lesson content (HTML/Markdown, required if contentType !== "mixed")' },
  duration: { type: "number", description: "Lesson duration in minutes (optional, default: 0)" },
  type: { type: "string", enum: ["text", "video", "interactive"], description: "Lesson type (optional)" },
  contentType: {
    type: "string",
    enum: ["standard", "labyrinth", "flippingCards", "mixed", "memoryGame", "tagCloud", "rolePlayGame", "textReconstruction", "presentation", "fullHtml", "htmlBlock", "video"],
    description: "Content type (optional)"
  },
  image: { type: "string", description: "Lesson image URL (optional)" },
  professions: {
    type: "array",
    items: { type: "string" },
    description: "Array of profession IDs from libservice (optional, can be empty array)",
    default: []
  },
  skills: {
    type: "array",
    items: { type: "string" },
    description: "Array of skill IDs from libservice (optional, can be empty array)",
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
  tools: {
    type: "array",
    items: { type: "string" },
    description: "Array of tool IDs from libraries service (optional, can be empty array)",
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
  videoUrl: { type: "string", description: "Video URL for module (optional)" },
  previewImage: { type: "string", description: "Preview image URL (optional)" },
  lessons: {
    type: "array",
    items: { type: "string" },
    description: "Array of lesson IDs (can be empty array)",
    default: []
  },
  isDraft: { type: "boolean", description: "Is draft (optional, default: true)" }
};
var testBaseSchema = {
  title: { type: "string", description: "Test title (required, automatically generates slug)" },
  description: { type: "string", description: "Test description (optional)" },
  lesson: { type: "string", description: "Lesson ID (required)" },
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
          required: ["question", "type", "options"]
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
          required: ["question", "type", "options"]
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
          required: ["question", "type", "options", "correctAnswer"]
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
          required: ["question", "type", "options", "correctAnswer"]
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
          required: ["question", "type", "options"]
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
  required: ["title", "lesson", "questions"],
  description: "Create a new test. IMPORTANT: Create lessons first using create_lesson tool, then attach tests to lessons. The system automatically generates slug and sets default values."
};
var updateTestInputSchema = {
  type: "object",
  properties: {
    testId: { type: "string", description: "Test ID for update" },
    ...testBaseSchema
  },
  required: ["testId", "title", "lesson", "questions"],
  description: "Update an existing test. IMPORTANT: Tests are attached to lessons, not modules."
};
var getProfessionsInputSchema = {
  type: "object",
  properties: {},
  description: "Get all professions without pagination"
};
var getToolsInputSchema = {
  type: "object",
  properties: {},
  description: "Get all tools without pagination"
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
  { name: "get_tools", inputSchema: getToolsInputSchema },
  { name: "get_modules", inputSchema: getModulesInputSchema },
  { name: "get_module", inputSchema: getModuleInputSchema },
  { name: "create_module", inputSchema: createModuleInputSchema },
  { name: "update_module", inputSchema: updateModuleInputSchema },
  { name: "get_tests", inputSchema: getTestsInputSchema },
  { name: "get_test", inputSchema: getTestInputSchema },
  { name: "create_test", inputSchema: createTestInputSchema },
  { name: "update_test", inputSchema: updateTestInputSchema }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCourseInputSchema,
  createLessonInputSchema,
  createModuleInputSchema,
  createTestInputSchema,
  getCourseInputSchema,
  getCoursesInputSchema,
  getLessonInputSchema,
  getLessonsInputSchema,
  getModuleInputSchema,
  getModulesInputSchema,
  getProfessionsInputSchema,
  getTestInputSchema,
  getTestsInputSchema,
  getToolsInputSchema,
  toolDefinitions,
  updateCourseInputSchema,
  updateLessonInputSchema,
  updateModuleInputSchema,
  updateTestInputSchema
});
