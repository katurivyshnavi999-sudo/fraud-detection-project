import axios from 'axios';

// Create Axios client with base URL pointing to FastAPI backend
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('payguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (username, password) => {
    const res = await apiClient.post('/auth/login', { username, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    }
  }
};

export const usersAPI = {
  getAll: async () => {
    const res = await apiClient.get('/users');
    return res.data;
  },
  getProfile: async (userId) => {
    const res = await apiClient.get(`/users/${encodeURIComponent(userId)}`);
    return res.data;
  }
};

export const transactionsAPI = {
  getAll: async (params = {}) => {
    const res = await apiClient.get('/transactions', { params });
    return res.data;
  },
  getUserTransactions: async (userId, params = {}) => {
    const res = await apiClient.get('/user/transactions', {
      params: { user_id: userId, ...params }
    });
    return res.data;
  },
  getById: async (transactionId) => {
    const res = await apiClient.get(`/transactions/${encodeURIComponent(transactionId)}`);
    return res.data;
  },
  getStats: async () => {
    const res = await apiClient.get('/transactions/stats');
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/transactions', data);
    return res.data;
  },
  predict: async (data) => {
    const res = await apiClient.post('/transactions/predict', data);
    return res.data;
  }
};

export const alertsAPI = {
  getAll: async (params = {}) => {
    const res = await apiClient.get('/alerts', { params });
    return res.data;
  },
  getUserAlerts: async (userId, params = {}) => {
    const res = await apiClient.get('/user/alerts', {
      params: { user_id: userId, ...params }
    });
    return res.data;
  },
  markAsRead: async (alertId) => {
    const res = await apiClient.patch(`/alerts/${encodeURIComponent(alertId)}`, { is_read: true });
    return res.data;
  }
};

export const investigationsAPI = {
  getList: async (params = {}) => {
    const res = await apiClient.get('/investigations', { params });
    return res.data;
  },
  getDossier: async (transactionId) => {
    const res = await apiClient.get(`/investigations/${encodeURIComponent(transactionId)}`);
    return res.data;
  },
  addNote: async (transactionId, notes, analystName = 'System Administrator') => {
    const res = await apiClient.post(`/investigations/${encodeURIComponent(transactionId)}/notes`, {
      notes,
      analyst_name: analystName
    });
    return res.data;
  },
  updateStatus: async (transactionId, status, notes = null, analystName = 'System Administrator') => {
    const res = await apiClient.patch(`/investigations/${encodeURIComponent(transactionId)}/status`, {
      status,
      notes,
      analyst_name: analystName
    });
    return res.data;
  }
};

export const simulationAPI = {
  getStatus: async () => {
    const res = await apiClient.get('/simulation/status');
    return res.data;
  },
  start: async () => {
    const res = await apiClient.post('/simulation/start');
    return res.data;
  },
  pause: async () => {
    const res = await apiClient.post('/simulation/pause');
    return res.data;
  },
  resume: async () => {
    const res = await apiClient.post('/simulation/resume');
    return res.data;
  },
  stop: async () => {
    const res = await apiClient.post('/simulation/stop');
    return res.data;
  },
  updateSettings: async (settings) => {
    const res = await apiClient.put('/simulation/settings', settings);
    return res.data;
  },
  generate: async (scenario = null) => {
    const res = await apiClient.post('/simulation/generate', null, {
      params: scenario ? { scenario } : {}
    });
    return res.data;
  }
};

export const modelsAPI = {
  getAll: async () => {
    const res = await apiClient.get('/models');
    return res.data;
  },
  getActive: async () => {
    const res = await apiClient.get('/models/active');
    return res.data;
  },
  getPerformance: async () => {
    const res = await apiClient.get('/models/performance');
    return res.data;
  },
  train: async (data = {}) => {
    const res = await apiClient.post('/models/train', data);
    return res.data;
  },
  activate: async (version) => {
    const res = await apiClient.post(`/models/${encodeURIComponent(version)}/activate`);
    return res.data;
  },
  getConfiguration: async () => {
    const res = await apiClient.get('/models/configuration');
    return res.data;
  },
  updateConfiguration: async (config) => {
    const res = await apiClient.put('/models/configuration', config);
    return res.data;
  },
  resetConfiguration: async () => {
    const res = await apiClient.post('/models/configuration/reset');
    return res.data;
  }
};

export const dashboardAPI = {
  getStats: async () => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data;
  }
};

export const graphAPI = {
  getGraph: async (params = {}) => {
    const res = await apiClient.get('/graph', { params });
    return res.data;
  },
  getNodeDetails: async (nodeId) => {
    const res = await apiClient.get(`/graph/${encodeURIComponent(nodeId)}`);
    return res.data;
  },
  getGnnStats: async () => {
    const res = await apiClient.get('/graph/gnn-stats');
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

export const reviewsAPI = {
  getAll: async (params = {}) => {
    const res = await apiClient.get('/reviews', { params });
    return res.data;
  },
  submit: async (data) => {
    const res = await apiClient.post('/reviews', data);
    return res.data;
  },
  getVerifiedLabels: async (params = {}) => {
    const res = await apiClient.get('/reviews/verified-labels', { params });
    return res.data;
  },
  addVerifiedLabel: async (data) => {
    const res = await apiClient.post('/reviews/verified-labels', data);
    return res.data;
  },
  getCandidateInfo: async () => {
    const res = await apiClient.get('/reviews/candidate-info');
    return res.data;
  },
  trainCandidate: async () => {
    const res = await apiClient.post('/reviews/candidate-train');
    return res.data;
  },
  promote: async (version) => {
    const res = await apiClient.post('/reviews/promote', null, { params: { version } });
    return res.data;
  },
  rollback: async (targetVersion = null) => {
    const res = await apiClient.post('/reviews/rollback', null, { params: targetVersion ? { target_version: targetVersion } : {} });
    return res.data;
  }
};

export const demoAPI = {
  getFiveAccountsScenario: async (scenario = 'legitimate_shared_merchant') => {
    const res = await apiClient.get('/demo/five-accounts/scenario', { params: { scenario } });
    return res.data;
  },
  runFiveAccounts: async (scenario = 'legitimate_shared_merchant') => {
    const res = await apiClient.post('/demo/five-accounts/run', null, { params: { scenario } });
    return res.data;
  },
  getFiveAccountsGraph: async (scenario = 'legitimate_shared_merchant') => {
    const res = await apiClient.get('/demo/five-accounts/graph', { params: { scenario } });
    return res.data;
  },
  explainFiveAccounts: async (txnId, scenario = 'legitimate_shared_merchant') => {
    const res = await apiClient.get(`/demo/five-accounts/explain/${encodeURIComponent(txnId)}`, { params: { scenario } });
    return res.data;
  }
};

export default apiClient;
