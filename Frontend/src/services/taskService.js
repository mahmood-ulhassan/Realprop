import api from './api';

const taskService = {
  // Get all tasks
  async getAll() {
    const response = await api.get('/tasks');
    return response.data;
  },

  // Get task by ID
  async getById(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  async create(data) {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // Update task
  async update(id, data) {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Update task status
  async updateStatus(id, status) {
    const response = await api.put(`/tasks/${id}/status`, { status });
    return response.data;
  },

  // Add comment to task
  async addComment(id, text, parentCommentId = null) {
    const response = await api.post(`/tasks/${id}/comments`, { text, parentCommentId });
    return response.data;
  },

  // Reassign task
  async reassign(id, comment) {
    const response = await api.put(`/tasks/${id}/reassign`, { comment });
    return response.data;
  },

  // Delete task
  async delete(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Get pending tasks count
  async getPendingCount() {
    const response = await api.get('/tasks/count/pending');
    return response.data;
  },

  // Mark task as viewed by admin
  async markAsViewed(id) {
    const response = await api.put(`/tasks/${id}/view`);
    return response.data;
  },

  // Mark comments as viewed by admin
  async markCommentsAsViewed(id) {
    const response = await api.put(`/tasks/${id}/view-comments`);
    return response.data;
  }
};

export default taskService;

