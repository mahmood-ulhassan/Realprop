import api from './api';

export const userService = {
  // Get all users
  getUsers: () => api.get('/users'),

  // Get single user by ID
  getUserById: (id) => api.get(`/users/${id}`),

  // Create user
  createUser: (data) => api.post('/users', data),

  // Update user
  updateUser: (id, data) => api.put(`/users/${id}`, data),

  // Delete user
  deleteUser: (id) => api.delete(`/users/${id}`),
};

