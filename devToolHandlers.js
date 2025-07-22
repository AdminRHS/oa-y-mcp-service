import fetch from 'node-fetch';
import { API_BASE_URL, API_BASE_URL_PROFESSIONS, API_TOKEN } from './index.js';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
});

export const devToolHandlers = {
  async get_courses(args) {
    const params = new URLSearchParams();
    if (args.page) params.append('page', args.page.toString());
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.difficulty) params.append('difficulty', args.difficulty);
    if (args.all) params.append('all', 'true');
    const response = await fetch(`${API_BASE_URL}/courses?${params}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_course(args) {
    const response = await fetch(`${API_BASE_URL}/courses/${args.courseId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async create_course(args) {
    let professions = args.professions || [];
    professions = professions.map(p => typeof p === 'object' && p._id ? p._id : p);
    const modules = [];
    if (Array.isArray(args.modules)) {
      for (const mod of args.modules) {
        const lessonIds = [];
        if (Array.isArray(mod.lessons)) {
          for (const lesson of mod.lessons) {
            if (typeof lesson === 'string') {
              lessonIds.push(lesson);
            } else if (lesson._id) {
              const lessonResp = await fetch(`${API_BASE_URL}/lessons/${lesson._id}`, {
                method: 'PUT', headers: getHeaders(), body: JSON.stringify(lesson)
              });
              if (!lessonResp.ok) throw new Error(`Error updating lesson: ${lessonResp.status} ${lessonResp.statusText}`);
              lessonIds.push(lesson._id);
            } else {
              const lessonResp = await fetch(`${API_BASE_URL}/lessons`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify(lesson)
              });
              if (!lessonResp.ok) throw new Error(`Error creating lesson: ${lessonResp.status} ${lessonResp.statusText}`);
              const lessonData = await lessonResp.json();
              if (lessonData.success && lessonData.data && lessonData.data._id) {
                lessonIds.push(lessonData.data._id);
              } else {
                throw new Error('Error creating lesson: _id not received');
              }
            }
          }
        }
        modules.push({
          title: mod.title,
          description: mod.description || '',
          content: mod.content || '',
          order: mod.order || 0,
          duration: mod.duration || 0,
          lessons: lessonIds,
          tests: mod.tests || [],
          achievements: mod.achievements || []
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
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(courseData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async update_course(args) {
    let professions = args.professions || [];
    professions = professions.map(p => typeof p === 'object' && p._id ? p._id : p);
    const courseData = { _id: args.courseId, ...args, professions };
    const courseId = args.courseId;
    delete courseData.courseId;
    if (Array.isArray(courseData.modules)) {
      for (const mod of courseData.modules) {
        if (Array.isArray(mod.lessons)) {
          for (let i = 0; i < mod.lessons.length; i++) {
            const lesson = mod.lessons[i];
            if (typeof lesson === 'string') continue;
            else if (lesson._id) {
              const lessonResp = await fetch(`${API_BASE_URL}/lessons/${lesson._id}`, {
                method: 'PUT', headers: getHeaders(), body: JSON.stringify(lesson)
              });
              if (!lessonResp.ok) throw new Error(`Error updating lesson: ${lessonResp.status} ${lessonResp.statusText}`);
            } else {
              const lessonResp = await fetch(`${API_BASE_URL}/lessons`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify(lesson)
              });
              if (!lessonResp.ok) throw new Error(`Error creating lesson: ${lessonResp.status} ${lessonResp.statusText}`);
              const lessonData = await lessonResp.json();
              if (lessonData.success && lessonData.data && lessonData.data._id) {
                mod.lessons[i] = lessonData.data._id;
              } else {
                throw new Error('Error creating lesson: _id not received');
              }
            }
          }
          mod.lessons = mod.lessons.map(lesson => typeof lesson === 'object' && lesson._id ? lesson._id : lesson);
        }
      }
    }
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(courseData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_lessons(args) {
    const params = new URLSearchParams();
    if (args.page) params.append('page', args.page.toString());
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.type) params.append('type', args.type);
    if (args.contentType) params.append('contentType', args.contentType);
    if (args.courseId) params.append('courseId', args.courseId);
    if (args.moduleId) params.append('moduleId', args.moduleId);
    if (args.sortBy) params.append('sortBy', args.sortBy);
    if (args.all) params.append('all', 'true');
    const response = await fetch(`${API_BASE_URL}/lessons?${params}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_lesson(args) {
    const response = await fetch(`${API_BASE_URL}/lessons/${args.lessonId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async create_lesson(args) {
    const lessonData = { ...args };
    const response = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(lessonData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async update_lesson(args) {
    const lessonId = args.lessonId || args._id;
    if (!lessonId) throw new Error('lessonId is required');
    const lessonData = { ...args };
    delete lessonData.lessonId;
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(lessonData)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_professions() {
    const response = await fetch(`${API_BASE_URL_PROFESSIONS}/profession`, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
}; 