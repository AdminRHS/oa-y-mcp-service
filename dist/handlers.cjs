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

// src/core/handlers.js
var handlers_exports = {};
__export(handlers_exports, {
  mcpToolHandlers: () => mcpToolHandlers,
  toolHandlers: () => toolHandlers
});
module.exports = __toCommonJS(handlers_exports);

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
      tools: args.tools || [],
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
    if (!courseData.tools && currentCourse.data?.tools) {
      courseData.tools = currentCourse.data.tools;
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
    if (!lessonData.tests && currentLesson.data?.tests) {
      lessonData.tests = currentLesson.data.tests.map((test) => test.id || test);
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
  async get_skills(args) {
    const url = buildLibsUrl("/skills?all=true&isShort=true");
    const response = await fetch(url, { headers: getLibsHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },
  async get_tools(args) {
    const url = buildLibsUrl("/tools?all=true&isShort=true");
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
    if (!testData.lesson && currentTest.data?.lesson) {
      testData.lesson = currentTest.data.lesson;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mcpToolHandlers,
  toolHandlers
});
