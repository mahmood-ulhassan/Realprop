import { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import './UserModal.css';

function ProjectModal({ isOpen, onClose, project = null, managers = [], onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    managerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      // Edit mode - populate form with project data
      setFormData({
        name: project.name || '',
        location: project.location || '',
        description: project.description || '',
        managerId: project.manager?._id || ''
      });
    } else {
      // Add mode - reset form
      setFormData({
        name: '',
        location: '',
        description: '',
        managerId: ''
      });
    }
    setError('');
  }, [project, isOpen]);

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
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }
    // Manager assignment is optional - can be assigned later

    setLoading(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        managerId: formData.managerId
      };

      if (project) {
        // Update existing project
        await projectService.updateProject(project._id, submitData);
      } else {
        // Create new project
        await projectService.createProject(submitData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'Add New Project'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter project location"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description (optional)"
              rows="4"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="managerId">Assigned Manager (Optional)</label>
            <select
              id="managerId"
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">No manager assigned (can assign later)</option>
              {managers.map(manager => (
                <option key={manager._id} value={manager._id}>
                  {manager.name} ({manager.email})
                </option>
              ))}
            </select>
            {managers.length === 0 && (
              <p className="form-hint">No managers available. You can create a manager user and assign them later.</p>
            )}
          </div>

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
              {loading ? 'Saving...' : project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectModal;

