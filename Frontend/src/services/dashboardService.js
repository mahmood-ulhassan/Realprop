import api from './api';

export const dashboardService = {
  // Get dashboard metrics
  getMetrics: (projectId, range, from, to) => {
    const params = { projectId, range };
    if (range === 'custom' && from && to) {
      params.from = from;
      params.to = to;
    }
    return api.get('/dashboard/metrics', { params });
  },
};

