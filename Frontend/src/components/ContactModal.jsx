import { useState, useEffect } from 'react';
import { leadService } from '../services/leadService';
import { projectService } from '../services/projectService';
import { authService } from '../services/authService';
import './ContactModal.css';

function ContactModal({ isOpen, onClose, lead = null, projectId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '',
    requirement: '',
    status: 'fresh',
    referredBy: '',
    leadSource: '',
    remark: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [referredOptions, setReferredOptions] = useState([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState([]);
  const [showAddReferred, setShowAddReferred] = useState(false);
  const [showAddLeadSource, setShowAddLeadSource] = useState(false);
  const [newReferred, setNewReferred] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('');
  const user = authService.getCurrentUser();

  // Load options from localStorage on mount
  useEffect(() => {
    const savedReferred = localStorage.getItem('referredOptions');
    const savedLeadSource = localStorage.getItem('leadSourceOptions');
    
    if (savedReferred) {
      setReferredOptions(JSON.parse(savedReferred));
    }
    if (savedLeadSource) {
      setLeadSourceOptions(JSON.parse(savedLeadSource));
    }
  }, []);

  useEffect(() => {
    if (lead) {
      // Edit mode - populate form with lead data
      setFormData({
        name: lead.name || '',
        contactNo: lead.contactNo || '',
        requirement: lead.requirement || '',
        status: lead.status || 'fresh',
        referredBy: lead.referredBy || '',
        leadSource: lead.leadSource || '',
        remark: ''
      });
      // Extract country code if present
      if (lead.contactNo && lead.contactNo.startsWith('+')) {
        const parts = lead.contactNo.split(' ');
        if (parts.length > 1) {
          setCountryCode(parts[0]);
          setFormData(prev => ({ ...prev, contactNo: parts.slice(1).join(' ') }));
        }
      }
    } else {
      // Add mode - reset form
      setFormData({
        name: '',
        contactNo: '',
        requirement: '',
        status: 'fresh',
        referredBy: '',
        leadSource: '',
        remark: ''
      });
      setCountryCode('+92');
    }
    setError('');
  }, [lead, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddReferred = () => {
    if (newReferred.trim()) {
      const updated = [...referredOptions, newReferred.trim()];
      setReferredOptions(updated);
      localStorage.setItem('referredOptions', JSON.stringify(updated));
      setFormData(prev => ({ ...prev, referredBy: newReferred.trim() }));
      setNewReferred('');
      setShowAddReferred(false);
    }
  };

  const handleAddLeadSource = () => {
    if (newLeadSource.trim()) {
      const updated = [...leadSourceOptions, newLeadSource.trim()];
      setLeadSourceOptions(updated);
      localStorage.setItem('leadSourceOptions', JSON.stringify(updated));
      setFormData(prev => ({ ...prev, leadSource: newLeadSource.trim() }));
      setNewLeadSource('');
      setShowAddLeadSource(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate requirement if status is "requirement"
    if (formData.status === 'requirement' && !formData.requirement.trim()) {
      setError('Requirement field is required when status is "Requirement"');
      return;
    }
    
    setLoading(true);

    try {
      // Combine country code with contact number
      const fullContactNo = `${countryCode} ${formData.contactNo.trim()}`;

      if (lead) {
        // Edit mode
        const updateData = {
          name: formData.name,
          contactNo: fullContactNo,
          requirement: formData.requirement,
          status: formData.status,
          referredBy: formData.referredBy,
          leadSource: formData.leadSource
        };

        // Add remark if provided
        if (formData.remark.trim()) {
          updateData.remark = formData.remark.trim();
        }

        await leadService.updateLead(lead._id, updateData);
      } else {
        // Add mode
        if (!projectId) {
          setError('Project is required');
          setLoading(false);
          return;
        }

        const newLead = {
          projectId,
          name: formData.name.trim(),
          contactNo: fullContactNo,
          requirement: formData.requirement?.trim() || '',
          status: formData.status,
          referredBy: formData.referredBy?.trim() || '',
          leadSource: formData.leadSource?.trim() || ''
        };

        // Only add remark if it has a value
        if (formData.remark?.trim()) {
          newLead.remark = formData.remark.trim();
        }

        await leadService.createLead(newLead);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contact');
      console.error('Error saving contact:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'fresh', label: 'Fresh' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'requirement', label: 'Requirement' },
    { value: 'hot', label: 'Hot' },
    { value: 'offer given', label: 'Offer Given' },
    { value: 'visit planned', label: 'Visit Planned' },
    { value: 'visited', label: 'Visited' },
    { value: 'closed', label: 'Closed' },
    { value: 'success', label: 'Success' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'fresh': '#3b82f6',
      'contacted': '#10b981',
      'requirement': '#f59e0b',
      'hot': '#ef4444',
      'offer given': '#8b5cf6',
      'visit planned': '#06b6d4',
      'visited': '#06b6d4',
      'closed': '#6b7280',
      'success': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  // Check if requirement field should be required
  const isRequirementRequired = formData.status === 'requirement';

  return (
    <div className="modal-overlay contact-modal-overlay" onClick={onClose}>
      <div className="modal-content contact-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{lead ? 'Edit Contact' : 'Add Contact'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactNo">Contact No</label>
              <div className="contact-input-group">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="country-code-select"
                >
                  <option value="+92">+92</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                  <option value="+971">+971</option>
                  <option value="+966">+966</option>
                  <option value="+60">+60</option>
                </select>
                <input
                  type="text"
                  id="contactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  required
                  placeholder="234 567 8901"
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="requirement">
                Requirement
                {isRequirementRequired && <span className="required-asterisk"> *</span>}
              </label>
              <input
                type="text"
                id="requirement"
                name="requirement"
                value={formData.requirement}
                onChange={handleChange}
                required={isRequirementRequired}
                placeholder="Enter requirement"
                className={isRequirementRequired && !formData.requirement.trim() ? 'required-field' : ''}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="status-select"
                style={{ 
                  backgroundColor: `${getStatusColor(formData.status)}20`,
                  color: getStatusColor(formData.status),
                  borderColor: getStatusColor(formData.status)
                }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-with-button">
              <div className="form-group">
                <label htmlFor="referredBy">Referred</label>
                {showAddReferred ? (
                  <div className="add-option-input">
                    <input
                      type="text"
                      value={newReferred}
                      onChange={(e) => setNewReferred(e.target.value)}
                      placeholder="Enter new referrer name"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddReferred();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="confirm-add-button"
                      onClick={handleAddReferred}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="cancel-add-button"
                      onClick={() => {
                        setShowAddReferred(false);
                        setNewReferred('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <select
                    id="referredBy"
                    name="referredBy"
                    value={formData.referredBy}
                    onChange={handleChange}
                  >
                    <option value="">Select referrer</option>
                    {referredOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {!showAddReferred && (
                <button
                  type="button"
                  className="add-button"
                  onClick={() => setShowAddReferred(true)}
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-with-button">
              <div className="form-group">
                <label htmlFor="leadSource">Lead Source</label>
                {showAddLeadSource ? (
                  <div className="add-option-input">
                    <input
                      type="text"
                      value={newLeadSource}
                      onChange={(e) => setNewLeadSource(e.target.value)}
                      placeholder="Enter new lead source"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLeadSource();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="confirm-add-button"
                      onClick={handleAddLeadSource}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="cancel-add-button"
                      onClick={() => {
                        setShowAddLeadSource(false);
                        setNewLeadSource('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <select
                    id="leadSource"
                    name="leadSource"
                    value={formData.leadSource}
                    onChange={handleChange}
                  >
                    <option value="">Select lead source</option>
                    {leadSourceOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {!showAddLeadSource && (
                <button
                  type="button"
                  className="add-button"
                  onClick={() => setShowAddLeadSource(true)}
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="remark">Remark</label>
              <textarea
                id="remark"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                rows="4"
                placeholder="Write a note or description about the lead..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactModal;

