import api from './api';

const inventoryService = {
  // Get all inventory items
  async getAll() {
    const response = await api.get('/inventory');
    return response.data;
  },

  // Get inventory item by ID
  async getById(id) {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  // Create new inventory item
  async create(data) {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  // Update inventory item
  async update(id, data) {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  // Delete inventory item
  async delete(id) {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },

  // Add note to inventory item
  async addNote(id, text) {
    const response = await api.post(`/inventory/${id}/notes`, { text });
    return response.data;
  },

  // Delete note from inventory item
  async deleteNote(id, noteId) {
    const response = await api.delete(`/inventory/${id}/notes/${noteId}`);
    return response.data;
  }
};

export default inventoryService;

