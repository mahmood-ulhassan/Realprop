import api from './api';

export const projectService = {
  // Get all projects
  getProjects: () => api.get('/projects'),

  // Get single project by ID
  getProjectById: (id) => api.get(`/projects/${id}`),

  // Create project (admin only)
  createProject: (data) => api.post('/projects', data),

  // Update project (admin only)
  updateProject: (id, data) => api.put(`/projects/${id}`, data),

  // Delete project (admin only)
  deleteProject: (id) => api.delete(`/projects/${id}`),

  // Seed projects (admin only)
  seedProjects: (clear = false) => 
    api.post(`/projects/seed${clear ? '?clear=true' : ''}`),
};

