import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is added by the auth store
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

export const accountsAPI = {
  list: () => api.get('/accounts'),
  get: (id) => api.get(`/accounts/${id}`),
  disconnect: (id) => api.delete(`/accounts/${id}`),
  getConnectUrl: (platform) => api.get(`/oauth/${platform}/connect`),
  refresh: (id) => api.post(`/accounts/${id}/refresh`),
  analytics: (id) => api.get(`/accounts/${id}/analytics`)
};

export const postsAPI = {
  list: (params) => api.get('/posts', { params }),
  get: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  publish: (id) => api.post(`/posts/${id}/publish`),
  calendar: (start, end) => api.get('/posts/calendar', { params: { start, end } })
};

export const messagesAPI = {
  list: (params) => api.get('/messages', { params }),
  conversations: (params) => api.get('/messages/conversations', { params }),
  conversation: (id, params) => api.get(`/messages/conversation/${id}`, { params }),
  send: (data) => api.post('/messages/send', data),
  markRead: (id) => api.put(`/messages/${id}/read`),
  unreadCount: () => api.get('/messages/unread-count')
};

export const subscriptionsAPI = {
  current: () => api.get('/subscriptions/current'),
  plans: () => api.get('/subscriptions/plans'),
  createCheckout: (plan) => api.post('/subscriptions/create-checkout', { plan }),
  createPortal: () => api.post('/subscriptions/create-portal'),
  cancel: () => api.post('/subscriptions/cancel'),
  resume: () => api.post('/subscriptions/resume'),
  invoices: () => api.get('/subscriptions/invoices'),
  usage: () => api.get('/subscriptions/usage')
};

export const aiAPI = {
  generateContent: (data) => api.post('/ai/generate-content', data),
  improveContent: (data) => api.post('/ai/improve-content', data),
  generateReply: (data) => api.post('/ai/generate-reply', data),
  hashtagSuggestions: (data) => api.post('/ai/hashtag-suggestions', data)
};

export default api;
