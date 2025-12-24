import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import './UserModal.css';

function UserModal({ isOpen, onClose, user = null, projects = [], onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager',
    projectId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      // Edit mode - populate form with user data
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't pre-fill password
        role: user.role || 'manager',
        projectId: user.projectIds && user.projectIds.length > 0 ? user.projectIds[0] : ''
      });
    } else {
      // Add mode - reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'manager',
        projectId: ''
      });
    }
    setError('');
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!user && !formData.password.trim()) {
      setError('Password is required for new users');
      return;
    }
    if (formData.role === 'manager' && !formData.projectId) {
      setError('Project assignment is required for managers');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        projectId: formData.projectId || undefined
      };

      // Only include password if it's provided (for new users or password updates)
      if (formData.password.trim()) {
        submitData.password = formData.password;
      }

      if (user) {
        // Update existing user
        await userService.updateUser(user._id, submitData);
      } else {
        // Create new user
        await userService.createUser(submitData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? 'Edit User' : 'Add New User'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password {user ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={user ? "Enter new password (optional)" : "Enter password"}
              disabled={loading}
              required={!user}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {formData.role === 'manager' && (
            <div className="form-group">
              <label htmlFor="projectId">Assigned Project *</label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading}
            >
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserModal;

