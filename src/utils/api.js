const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.226:20325';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const buildUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

const handleResponse = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload && (payload.detail || payload.message)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload ?? {};
};

const request = async (path, options = {}) => {
  const { method = 'GET', body, token, headers = {}, ...rest } = options;
  const mergedHeaders = {
    ...defaultHeaders,
    ...headers,
  };
  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }
  const fetchOptions = {
    method,
    headers: mergedHeaders,
    ...rest,
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }
  const response = await fetch(buildUrl(path), fetchOptions);
  return handleResponse(response);
};

const streamRequest = async (path, options = {}) => {
  const { method = 'GET', body, token, headers = {}, signal, ...rest } = options;
  const mergedHeaders = {
    ...defaultHeaders,
    ...headers,
  };
  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }
  const fetchOptions = {
    method,
    headers: mergedHeaders,
    signal,
    ...rest,
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }
  const response = await fetch(buildUrl(path), fetchOptions);
  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }
    const message =
      (payload && (payload.detail || payload.message)) ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return response;
};

export const authApi = {
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  logout: (token) => request('/api/auth/logout', { method: 'POST', token }),
  me: (token) => request('/api/auth/me', { token }),
  refresh: (token) => request('/api/auth/refresh', { method: 'POST', token }),
  captcha: () => request('/api/auth/captcha', { method: 'POST' }),
  resetPassword: (payload) => request('/api/auth/password/reset', { method: 'POST', body: payload }),
};

export const sessionApi = {
  list: (token) => request('/api/sessions', { token }),
  create: (token, metadata = {}) =>
    request('/api/session/create', { method: 'POST', token, body: { metadata } }),
  history: (token, sessionId, { limit } = {}) => {
    const query = typeof limit === 'number' ? `?limit=${limit}` : '';
    return request(`/api/session/${sessionId}/history${query}`, { token });
  },
  touch: (token, sessionId) =>
    request(`/api/session/${sessionId}`, { method: 'PUT', token, body: { touch: true } }),
  update: (token, sessionId, payload) =>
    request(`/api/session/${sessionId}`, { method: 'PUT', token, body: payload }),
  delete: (token, sessionId) =>
    request(`/api/session/${sessionId}`, { method: 'DELETE', token }),
};

export const modelApi = {
  list: (token) => request('/api/models', { token }),
};

export const chatApi = {
  stream: (token, payload, options = {}) =>
    streamRequest('/api/chat', { method: 'POST', token, body: payload, ...options }),
  regenerate: (token, payload, options = {}) =>
    streamRequest('/api/chat/regenerate', { method: 'POST', token, body: payload, ...options }),
};

export const tasksApi = {
  list: (token, status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/tasks${query}`, { token });
  },
  get: (token, taskId) => request(`/api/tasks/${taskId}`, { token }),
  cancel: (token, taskId) => request(`/api/tasks/${taskId}/cancel`, { method: 'POST', token }),
  restart: (token, taskId) => request(`/api/tasks/${taskId}/restart`, { method: 'POST', token }),
  delete: (token, taskId) => request(`/api/tasks/${taskId}`, { method: 'DELETE', token }),
  download: async (token, taskId) => {
    const response = await fetch(buildUrl(`/api/tasks/${taskId}/download`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const message = `Request failed with status ${response.status}`;
      throw new Error(message);
    }
    return response.blob();
  },
};

export const reportsApi = {
  list: (token, toolName) => {
    const query = toolName ? `?tool_name=${encodeURIComponent(toolName)}` : '';
    return request(`/api/reports${query}`, { token });
  },
  get: (token, reportId) => request(`/api/reports/${reportId}`, { token }),
};

export const loadInitialAppData = async (token) => {
  const [sessionResp, modelResp, userResp] = await Promise.all([
    sessionApi.list(token),
    modelApi.list(token),
    authApi.me(token),
  ]);

  return {
    sessions: sessionResp?.sessions ?? [],
    models: modelResp?.models ?? [],
    defaultModel: modelResp?.default ?? null,
    user: userResp?.user ?? null,
  };
};

export default request;
