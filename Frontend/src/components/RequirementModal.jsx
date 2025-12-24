import { useState, useEffect } from 'react';
import './RequirementModal.css';

function RequirementModal({ isOpen, onClose, lead }) {
  if (!isOpen || !lead) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
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

  return (
    <div className="requirement-modal-overlay" onClick={onClose}>
      <div className="requirement-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="requirement-modal-header">
          <h2>Requirement Details</h2>
          <button className="requirement-close-button" onClick={onClose}>×</button>
        </div>

        <div className="requirement-modal-body">
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

          {/* Requirement Content */}
          <div className="requirement-content-section">
            <h4>Requirement</h4>
            <div className="requirement-text">
              {lead.requirement || 'No requirement specified'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequirementModal;

