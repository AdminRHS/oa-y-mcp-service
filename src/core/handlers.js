/**
 * MCP Tool Handlers for OA-Y Learning Platform
 * Business logic for all MCP tools
 */

import { config, getApiHeaders, getLibsHeaders, buildApiUrl, buildLibsUrl } from './config.js';

/**
 * Build URL with query parameters
 * @param {string} endpoint - Base endpoint
 * @param {Object} params - Query parameters
 * @returns {string} Full URL with query string
 */
function buildUrlWithParams(endpoint, params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

/**
 * Process profession IDs (normalize to array of strings/numbers)
 * @param {Array} professions - Array of profession IDs (objects, numbers, or strings)
 * @returns {Array} Normalized array
 */
function processProfessions(professions) {
  if (!Array.isArray(professions)) return [];

  return professions.map(p => {
    if (typeof p === 'object' && p._id) return p._id;
    if (typeof p === 'number') return p.toString();
    if (typeof p === 'string') return p;
    return p;
  }).filter(Boolean);
}

/**
 * Tool handlers - business logic only
 * Returns plain data (not wrapped in MCP format)
 */
export const toolHandlers = {
  /**
   * Get courses with pagination and filters
   */
  async get_courses(args) {
    const params = {};
    if (args.page) params.page = args.page;
    if (args.limit) params.limit = args.limit;
    if (args.search) params.search = args.search;
    if (args.difficulty) params.difficulty = args.difficulty;
    if (args.all) params.all = 'true';

    // Handle professions filter
    if (args.professions && Array.isArray(args.professions)) {
      const professionIds = processProfessions(args.professions);
      if (professionIds.length > 0) {
        params.professions = professionIds;
      }
    }

    const url = buildUrlWithParams(buildApiUrl('/courses'), params);
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

    // Process modules - expect module IDs with order
    const modules = [];
    if (Array.isArray(args.modules)) {
      for (const mod of args.modules) {
        if (!mod.module || typeof mod.module !== 'string') {
          throw new Error('Module ID is required and must be a string. Create modules first using create_module tool.');
        }
        if (typeof mod.order !== 'number') {
          throw new Error('Module order is required and must be a number.');
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
      modules,
    };

    const url = buildApiUrl('/courses');
    const response = await fetch(url, {
      method: 'POST',
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

    // First, get the current course to preserve existing relationships
    const currentUrl = buildApiUrl(`/courses/${courseId}`);
    const currentCourseResponse = await fetch(currentUrl, { headers: getApiHeaders() });

    if (!currentCourseResponse.ok) {
      throw new Error(`Failed to get current course: HTTP ${currentCourseResponse.status}`);
    }

    const currentCourse = await currentCourseResponse.json();

    const courseData = { _id: courseId, ...args, professions };
    delete courseData.courseId;

    // If modules not provided, keep existing ones
    if (!courseData.modules && currentCourse.data?.modules) {
      courseData.modules = currentCourse.data.modules.map(module => ({
        module: module.id,
        order: module.order || 1
      }));
    }

    // Process modules - expect module IDs with order
    if (Array.isArray(courseData.modules)) {
      for (const mod of courseData.modules) {
        if (!mod.module || typeof mod.module !== 'string') {
          throw new Error('Module ID is required and must be a string. Create modules first using create_module tool.');
        }
        if (typeof mod.order !== 'number') {
          throw new Error('Module order is required and must be a number.');
        }
      }
    }

    const url = buildApiUrl(`/courses/${courseId}`);
    const response = await fetch(url, {
      method: 'PUT',
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
    if (args.all) params.all = 'true';

    // Handle professions filter
    if (args.professions && Array.isArray(args.professions)) {
      const professionIds = processProfessions(args.professions);
      if (professionIds.length > 0) {
        params.professions = professionIds;
      }
    }

    const url = buildUrlWithParams(buildApiUrl('/lessons'), params);
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

    const url = buildApiUrl('/lessons');
    const response = await fetch(url, {
      method: 'POST',
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
    if (!lessonId) throw new Error('lessonId is required');

    // First, get the current lesson to preserve existing relationships
    const currentUrl = buildApiUrl(`/lessons/${lessonId}`);
    const currentLessonResponse = await fetch(currentUrl, { headers: getApiHeaders() });

    if (!currentLessonResponse.ok) {
      throw new Error(`Failed to get current lesson: HTTP ${currentLessonResponse.status}`);
    }

    const currentLesson = await currentLessonResponse.json();

    let professions = processProfessions(args.professions || []);

    const lessonData = { ...args, professions };
    delete lessonData.lessonId;

    // If module not provided, keep existing one
    if (!lessonData.module && currentLesson.data?.module) {
      lessonData.module = currentLesson.data.module;
    }

    // If tests not provided, keep existing ones
    if (!lessonData.tests && currentLesson.data?.tests) {
      lessonData.tests = currentLesson.data.tests.map(test => test.id || test);
    }

    const url = buildApiUrl(`/lessons/${lessonId}`);
    const response = await fetch(url, {
      method: 'PUT',
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
    const url = buildLibsUrl('/professions?all=true&isShort=true');
    const response = await fetch(url, { headers: getLibsHeaders() });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },


  async get_skills(args) {
    const url = buildLibsUrl('/skills?all=true&isShort=true');
    const response = await fetch(url, { headers: getLibsHeaders() });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  async get_tools(args) {
    const url = buildLibsUrl('/tools?all=true&isShort=true');
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

    const url = buildUrlWithParams(buildApiUrl('/modules'), params);
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

    const url = buildApiUrl('/modules');
    const response = await fetch(url, {
      method: 'POST',
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
    if (!moduleId) throw new Error('moduleId is required');

    // First, get the current module to preserve existing relationships
    const currentUrl = buildApiUrl(`/modules/${moduleId}`);
    const currentModuleResponse = await fetch(currentUrl, { headers: getApiHeaders() });

    if (!currentModuleResponse.ok) {
      throw new Error(`Failed to get current module: HTTP ${currentModuleResponse.status}`);
    }

    const currentModule = await currentModuleResponse.json();

    // Preserve existing lessons if not provided in update
    const moduleData = { ...args };
    delete moduleData.moduleId;

    // If lessons not provided, keep existing ones
    if (!moduleData.lessons && currentModule.data?.lessons) {
      moduleData.lessons = currentModule.data.lessons.map(lesson => lesson.id);
    }

    const url = buildApiUrl(`/modules/${moduleId}`);
    const response = await fetch(url, {
      method: 'PUT',
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

    const url = buildUrlWithParams(buildApiUrl('/tests'), params);
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

    const url = buildApiUrl('/tests');
    const response = await fetch(url, {
      method: 'POST',
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
    if (!testId) throw new Error('testId is required');

    // First, get the current test to preserve existing relationships
    const currentUrl = buildApiUrl(`/tests/${testId}`);
    const currentTestResponse = await fetch(currentUrl, { headers: getApiHeaders() });

    if (!currentTestResponse.ok) {
      throw new Error(`Failed to get current test: HTTP ${currentTestResponse.status}`);
    }

    const currentTest = await currentTestResponse.json();

    const testData = { ...args };
    delete testData.testId;

    // If lesson not provided, keep existing one
    if (!testData.lesson && currentTest.data?.lesson) {
      testData.lesson = currentTest.data.lesson;
    }

    const url = buildApiUrl(`/tests/${testId}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },
};

/**
 * MCP-compatible tool handlers
 * Wraps plain data in MCP content format
 */
export const mcpToolHandlers = {};
Object.keys(toolHandlers).forEach(toolName => {
  mcpToolHandlers[toolName] = async (args) => {
    const result = await toolHandlers[toolName](args);
    // Wrap in MCP content format
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  };
});
