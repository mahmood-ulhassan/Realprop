import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import taskService from '../services/taskService';
import './TaskModal.css';

function TaskModal({ isOpen, onClose, task = null, users = [], projects = [], onSuccess, initialLeadId = null, initialLeadContactNo = null, tasksCount = 0 }) {
  const [formData, setFormData] = useState({
    number: '',
    description: '',
    assignedTo: '',
    projectId: '',
    leadId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = authService.getCurrentUser();
  

  useEffect(() => {
    if (!isOpen) return; // Don't update if modal is closed
    
    if (task) {
      // Edit mode - populate form with task data
      setFormData({
        number: task.number || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        projectId: task.projectId?._id || task.projectId || '',
        leadId: task.leadId?._id || task.leadId || ''
      });
    } else {
      // Add mode - reset form
      const formDataObj = {
        number: initialLeadContactNo || '',
        description: '',
        assignedTo: '',
        projectId: '',
        leadId: initialLeadId || ''
      };
      
      // If initialLeadId is provided, set it in leadId
      if (initialLeadId) {
        formDataObj.leadId = initialLeadId;
      }
      
      setFormData(formDataObj);
    }
  }, [isOpen, task?._id || null, initialLeadId, initialLeadContactNo]); // Use task._id instead of task object, remove user

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If assignedTo changes, handle project auto-assignment
    if (name === 'assignedTo' && value) {
      const assignedUser = users.find(u => u._id === value);
      if (assignedUser && assignedUser.role === 'manager' && assignedUser.projectIds && assignedUser.projectIds.length === 1) {
        // Single project - auto-assign
        setFormData(prev => ({
          ...prev,
          [name]: value,
          projectId: assignedUser.projectIds[0]
        }));
        return;
      } else if (assignedUser && assignedUser.role && assignedUser.role.toLowerCase() === 'manager' && assignedUser.projectIds && assignedUser.projectIds.length > 1) {
        // Multiple projects - clear projectId so user can select
        setFormData(prev => ({
          ...prev,
          [name]: value,
          projectId: ''
        }));
        return;
      }
    }
    
    // Default: just update the field
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.number.trim()) {
      setError('Number is required');
      return;
    }

    if (!formData.assignedTo) {
      setError('Assigned To is required');
      return;
    }

    const assignedUser = users.find(u => u._id === formData.assignedTo);
    if (assignedUser && assignedUser.role === 'manager' && assignedUser.projectIds && assignedUser.projectIds.length > 1 && !formData.projectId) {
      setError('Project is required when manager has multiple projects');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        number: formData.number.trim(),
        description: formData.description.trim() || undefined,
        assignedTo: formData.assignedTo,
        projectId: formData.projectId || undefined,
        leadId: formData.leadId || undefined
      };

      if (task) {
        await taskService.update(task._id, submitData);
      } else {
        await taskService.create(submitData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter managers - case insensitive check and ensure users array exists
  const managers = Array.isArray(users) 
    ? users.filter(u => {
        if (!u || !u.role) return false;
        const role = typeof u.role === 'string' ? u.role.toLowerCase().trim() : String(u.role).toLowerCase().trim();
        return role === 'manager';
      })
    : [];
  
  // Debug: Log to help identify the issue
  useEffect(() => {
    if (isOpen) {
      console.log('TaskModal: Users prop:', users);
      console.log('TaskModal: Users array length:', Array.isArray(users) ? users.length : 'not an array');
      console.log('TaskModal: Managers found:', managers.length);
      if (managers.length === 0 && Array.isArray(users) && users.length > 0) {
        console.log('TaskModal: All users and their roles:', users.map(u => ({ 
          id: u._id, 
          name: u.name, 
          role: u.role, 
          roleType: typeof u.role 
        })));
      }
    }
  }, [isOpen, users, managers.length]);

  return (
    <div className="modal-overlay task-modal-overlay" onClick={onClose}>
      <div className="modal-content task-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="number">Contact Number *</label>
            <input
              type="text"
              id="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              onPaste={(e) => {
                // Allow paste to work normally
                const pastedText = e.clipboardData.getData('text');
                if (pastedText) {
                  e.preventDefault();
                  setFormData(prev => ({
                    ...prev,
                    number: pastedText
                  }));
                }
              }}
              placeholder={initialLeadContactNo || "Enter contact number"}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="assignedTo">Assigned To *</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              required
              disabled={loading || user.role !== 'admin'}
            >
              <option value="">Select manager</option>
              {managers.length === 0 ? (
                <option value="" disabled>No managers available</option>
              ) : (
                managers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {formData.assignedTo && (() => {
            const assignedUser = users.find(u => u._id === formData.assignedTo);
            if (assignedUser && assignedUser.role === 'manager' && assignedUser.projectIds && assignedUser.projectIds.length > 1) {
              return (
                <div className="form-group">
                  <label htmlFor="projectId">Project *</label>
                  <select
                    id="projectId"
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select project</option>
                    {assignedUser.projectIds.map(projectId => {
                      const project = projects.find(p => p._id === projectId);
                      return project ? (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
              );
            }
            return null;
          })()}

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
              rows="4"
              disabled={loading}
            />
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
              {loading ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;

