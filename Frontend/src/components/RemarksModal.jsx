import { useState, useEffect } from 'react';
import { leadService } from '../services/leadService';
import { authService } from '../services/authService';
import './RemarksModal.css';

function RemarksModal({ isOpen, onClose, lead }) {
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (isOpen && lead) {
      // Load remarks from lead data
      if (lead.remarks && Array.isArray(lead.remarks)) {
        // Sort remarks by timestamp (newest first)
        const sortedRemarks = [...lead.remarks].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0);
          const dateB = new Date(b.timestamp || b.createdAt || 0);
          return dateB - dateA;
        });
        setRemarks(sortedRemarks);
      } else {
        setRemarks([]);
      }
      setNewRemark('');
      setError('');
    }
  }, [isOpen, lead]);

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };

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
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) {
      setError('Please enter a remark');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await leadService.addRemark(lead._id, newRemark.trim());
      
      // Update remarks list with the new remark
      const updatedRemarks = response.data.remarks || [];
      const sortedRemarks = [...updatedRemarks].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0);
        const dateB = new Date(b.timestamp || b.createdAt || 0);
        return dateB - dateA;
      });
      setRemarks(sortedRemarks);
      setNewRemark('');
      
      // Notify parent to refresh lead data
      if (onClose) {
        // Pass a flag to indicate refresh is needed
        onClose(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add remark');
      console.error('Error adding remark:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddRemark();
    }
  };

  if (!isOpen || !lead) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="remarks-modal-overlay" onClick={() => onClose(false)}>
      <div className="remarks-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="remarks-modal-header">
          <h2>Remarks Timeline</h2>
          <button className="remarks-close-button" onClick={() => onClose(false)}>×</button>
        </div>

        <div className="remarks-modal-body">
          {/* Lead Information */}
          <div className="lead-info-section">
            <div className="lead-avatar">
              {getInitials(lead.name)}
            </div>
            <div className="lead-details">
              <div className="lead-name-row">
                <h3>{lead.name}</h3>
                <span 
                  className="lead-status-badge"
                  style={{ backgroundColor: getStatusColor(lead.status) }}
                >
                  {lead.status || 'New'}
                </span>
              </div>
              <p className="lead-contact">{lead.contactNo}</p>
            </div>
          </div>

          {/* Remarks Timeline */}
          <div className="remarks-timeline">
            {remarks.length === 0 ? (
              <div className="no-remarks">
                <p>No remarks yet. Add the first remark below.</p>
              </div>
            ) : (
              <div className="timeline-container">
                <div className="timeline-line"></div>
                {remarks.map((remark, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="remark-date">
                        {formatDateTime(remark.timestamp || remark.createdAt)}
                      </div>
                      <div className="remark-text">{remark.text}</div>
                      <div className="remark-author">
                        Added by: {remark.addedBy?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Remark Section */}
          <div className="add-remark-section">
            {error && <div className="remark-error">{error}</div>}
            <div className="add-remark-input-group">
              <input
                type="text"
                className="remark-input"
                placeholder="Add a remark..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={submitting}
              />
              <button
                className="add-remark-button"
                onClick={handleAddRemark}
                disabled={submitting || !newRemark.trim()}
              >
                {submitting ? 'Adding...' : 'Add Remark'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RemarksModal;

