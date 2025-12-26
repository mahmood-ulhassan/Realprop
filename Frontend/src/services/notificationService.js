import api from './api';

const notificationService = {
  // Get all notifications for current user
  async getAll() {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Get unread notification count
  async getUnreadCount() {
    const response = await api.get('/notifications/count');
    return response.data.count;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.put('/notifications/read');
    return response.data;
  },

  // Mark single notification as read
  async markAsRead(id) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Clear all notifications
  async clearAll() {
    const response = await api.delete('/notifications');
    return response.data;
  }
};

export default notificationService;

