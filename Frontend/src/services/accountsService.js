import api from './api';

const accountsService = {
  createAccount: async (accountData) => {
    const response = await api.post('/accounts', accountData);
    return response.data;
  },
  
  getAccounts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/accounts?${params.toString()}`);
    return response.data;
  },
  
  getAccountSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/accounts/summary?${params.toString()}`);
    return response.data;
  },
  
  getCategories: async (projectId) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    
    const response = await api.get(`/accounts/categories?${params.toString()}`);
    return response.data;
  },
  
  getModes: async () => {
    const response = await api.get('/accounts/modes');
    return response.data;
  },
  
  getBalance: async () => {
    const response = await api.get('/accounts/balance');
    return response.data;
  },
  
  updateAccount: async (id, accountData) => {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response.data;
  },
  
  deleteAccount: async (id) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  }
};

export default accountsService;

