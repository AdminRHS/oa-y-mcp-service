import fetch from 'node-fetch';
import { API_TOKEN } from './index.js';
let legacyJwt = null;

const API_BASE_URL = 'https://oa-y.com';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
});

export const prodToolHandlers = {
  async create_or_update_course(args) {
    const response = await fetch(`${API_BASE_URL}/api-token/course`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(args)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async get_courses(args) {
    if (!legacyJwt) throw new Error('Not logged in. Please use login first.');
    const params = new URLSearchParams();
    if (args.page) params.append('page', args.page.toString());
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.all) params.append('all', 'true');
    const response = await fetch(`${API_BASE_URL}/api/courses?${params}`, {
      headers: { 'Authorization': `Bearer ${legacyJwt}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  },
  async login(args) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: args.email, password: args.password })
    });
    const data = await response.json();
    if (data.token) {
      legacyJwt = data.token;
      return { content: [{ type: 'text', text: 'Login successful' }] };
    } else {
      throw new Error(data.message || 'Login failed');
    }
  }
}; 