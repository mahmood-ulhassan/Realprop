import api from './api';

export const leadService = {
  // Get leads (admin: requires projectId query, manager: auto)
  getLeads: (projectId) => {
    const params = projectId ? { projectId } : {};
    return api.get('/leads', { params });
  },

  // Create lead
  createLead: (data) => api.post('/leads', data),

  // Update lead
  updateLead: (id, data) => api.put(`/leads/${id}`, data),

  // Add remark to lead
  addRemark: (id, text) => api.post(`/leads/${id}/remarks`, { text }),
};

