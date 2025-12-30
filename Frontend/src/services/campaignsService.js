import api from './api';

const campaignsService = {
  createCampaign: async (campaignData) => {
    const response = await api.post('/campaigns', campaignData);
    return response.data;
  },
  
  listCampaigns: async () => {
    const response = await api.get('/campaigns');
    return response.data;
  },
  
  getCampaign: async (id) => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  },
  
  updateCampaign: async (id, campaignData) => {
    const response = await api.put(`/campaigns/${id}`, campaignData);
    return response.data;
  },
  
  deleteCampaign: async (id) => {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data;
  },
  
  getAllCampaignLeads: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.campaignId) params.append('campaignId', filters.campaignId);
    if (filters.status) params.append('status', filters.status);
    if (filters.managerId) params.append('managerId', filters.managerId);
    
    const response = await api.get(`/campaigns/leads/all?${params.toString()}`);
    return response.data;
  },
  
  updateLeadStatus: async (leadId, status) => {
    const response = await api.put(`/campaigns/leads/${leadId}`, { status });
    return response.data;
  },
  
  addRemark: async (leadId, text) => {
    const response = await api.post(`/campaigns/leads/${leadId}/remarks`, { text });
    return response.data;
  }
};

export default campaignsService;

