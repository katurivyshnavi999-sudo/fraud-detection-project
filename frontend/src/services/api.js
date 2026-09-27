import axios from 'axios';

// Create Axios client with base URL pointing to FastAPI backend
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching auth tokens if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fraudshield_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  }
};

export const dashboardAPI = {
  getStats: async () => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data;
  }
};

export const transactionsAPI = {
  getAll: async (params = {}) => {
    const res = await apiClient.get('/transactions', { params });
    return res.data;
  },
  predict: async (data) => {
    const res = await apiClient.post('/transactions/predict', data);
    return res.data;
  }
};

export const graphAPI = {
  getGraph: async () => {
    const res = await apiClient.get('/graph');
    return res.data;
  },
  getNodeDetails: async (nodeId) => {
    const res = await apiClient.get(`/graph/${encodeURIComponent(nodeId)}`);
    return res.data;
  }
};

export const explanationAPI = {
  getExplanation: async (transactionId) => {
    const res = await apiClient.get(`/explanation/${encodeURIComponent(transactionId)}`);
    return res.data;
  }
};

export const continualAPI = {
  getStatus: async () => {
    const res = await apiClient.get('/model/status');
    return res.data;
  },
  simulateUpdate: async (data = {}) => {
    const res = await apiClient.post('/model/update', data);
    return res.data;
  }
};

export const datasetAPI = {
  getSample: async () => {
    const res = await apiClient.get('/dataset/sample');
    return res.data;
  },
  upload: async (formData) => {
    const res = await apiClient.post('/dataset/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export const analyticsAPI = {
  getAnalytics: async () => {
    const res = await apiClient.get('/analytics');
    return res.data;
  }
};

export const projectAPI = {
  getInfo: async () => {
    const res = await apiClient.get('/project/info');
    return res.data;
  }
};

export default apiClient;
