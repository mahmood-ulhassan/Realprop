import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import campaignsService from '../services/campaignsService';
import { userService } from '../services/userService';
import RemarksModal from '../components/RemarksModal';
import './Campaigns.css';
import './Dashboard.css';

function Campaigns() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' or 'leads'
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filters for leads
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedRemarksFilter, setSelectedRemarksFilter] = useState('');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showRemarksFilter, setShowRemarksFilter] = useState(false);
  
  // Search for campaigns
  const [campaignSearch, setCampaignSearch] = useState('');
  
  // Search for leads
  const [leadSearch, setLeadSearch] = useState('');
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [campaignToAssign, setCampaignToAssign] = useState(null);
  const [newManagerId, setNewManagerId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [selectedLeadForRemarks, setSelectedLeadForRemarks] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
      loadManagers();
      loadCampaigns();
      loadLeads();
    }
  }, [navigate]);

  const loadManagers = async () => {
    try {
      const response = await userService.getUsers();
      const allUsers = response.data || [];
      const managersList = allUsers.filter(u => u.role === 'manager');
      setManagers(managersList);
    } catch (err) {
      console.error('Error loading managers:', err);
    }
  };

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    setError('');
    try {
      const data = await campaignsService.listCampaigns();
      console.log('Campaigns loaded:', data);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError(err.response?.data?.message || 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadLeads = async (filters = {}) => {
    setLoadingLeads(true);
    setError('');
    try {
      const data = await campaignsService.getAllCampaignLeads(filters);
      setLeads(data);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleCampaignClick = (campaignId) => {
    setSelectedCampaign(campaignId);
    setActiveTab('leads');
    loadLeads({ campaignId });
  };

  const handleFilterChange = () => {
    const filters = {};
    if (selectedCampaign) filters.campaignId = selectedCampaign;
    if (selectedManager) filters.managerId = selectedManager;
    loadLeads(filters);
  };

  useEffect(() => {
    if (activeTab === 'leads') {
      handleFilterChange();
    }
  }, [selectedCampaign, selectedManager]);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-header')) {
        setShowStatusFilter(false);
        setShowRemarksFilter(false);
      }
    };

    if (showStatusFilter || showRemarksFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showStatusFilter, showRemarksFilter]);

  const handleAssignManager = (campaign) => {
    setCampaignToAssign(campaign);
    setNewManagerId(campaign.assignedTo._id);
    setShowAssignModal(true);
  };

  const handleSubmitAssign = async () => {
    if (!newManagerId) {
      setError('Please select a manager');
      return;
    }

    try {
      await campaignsService.updateCampaign(campaignToAssign._id, { assignedTo: newManagerId });
      setSuccessMessage('Campaign assigned successfully!');
      setShowAssignModal(false);
      loadCampaigns();
      loadLeads({ campaignId: selectedCampaign, managerId: selectedManager });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign campaign');
    }
  };

  const handleDeleteClick = (campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await campaignsService.deleteCampaign(campaignToDelete._id);
      setSuccessMessage('Campaign deleted successfully!');
      setShowDeleteConfirm(false);
      setCampaignToDelete(null);
      loadCampaigns();
      if (selectedCampaign === campaignToDelete._id) {
        setSelectedCampaign('');
        loadLeads();
      } else {
        loadLeads({ campaignId: selectedCampaign, managerId: selectedManager });
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      await campaignsService.updateLeadStatus(leadId, newStatus);
      // Update the lead status in the local state instead of reloading all leads
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead._id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update lead status');
      // Reload leads on error to ensure consistency
      loadLeads({ campaignId: selectedCampaign, managerId: selectedManager });
    }
  };

  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-main ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Campaigns" sidebarOpen={sidebarOpen} />
        
        <main className="dashboard-content">
          <div className="campaigns-container">
            {/* Tabs */}
            <div className="campaigns-tabs">
              <button
                className={`tab-button ${activeTab === 'campaigns' ? 'active' : ''}`}
                onClick={() => setActiveTab('campaigns')}
              >
                CAMPAIGNS
              </button>
              <button
                className={`tab-button ${activeTab === 'leads' ? 'active' : ''}`}
                onClick={() => setActiveTab('leads')}
              >
                LEADS
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message" style={{ 
                backgroundColor: '#fee', 
                color: '#c33', 
                padding: '1rem', 
                borderRadius: '4px', 
                marginTop: '1rem' 
              }}>
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="success-message" style={{ 
                backgroundColor: '#d4edda', 
                color: '#155724', 
                padding: '1rem', 
                borderRadius: '4px', 
                marginTop: '1rem',
                border: '1px solid #c3e6cb'
              }}>
                {successMessage}
              </div>
            )}

            {/* CAMPAIGNS Tab */}
            {activeTab === 'campaigns' && (
              <div className="campaigns-tab-content">
                {loadingCampaigns ? (
                  <div className="loading">Loading campaigns...</div>
                ) : campaigns.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>No campaigns found. Create a campaign from the Generate Leads page.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <div className="table-header">
                      <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={campaignSearch}
                        onChange={(e) => setCampaignSearch(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.675rem 0.9rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '5.4px',
                          fontSize: '0.84375rem',
                          outline: 'none'
                        }}
                      />
                      <div className="pagination-info" style={{ marginLeft: '1rem' }}>
                        Showing {campaigns.filter(c => 
                          !campaignSearch || 
                          c.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                          (c.assignedTo?.name || '').toLowerCase().includes(campaignSearch.toLowerCase())
                        ).length} of {campaigns.length}
                      </div>
                    </div>
                    <table className="campaigns-table">
                      <thead>
                        <tr>
                          <th>Campaign Name</th>
                          <th>Assigned To</th>
                          <th>Leads Count</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.filter(campaign => 
                          !campaignSearch || 
                          campaign.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                          (campaign.assignedTo?.name || '').toLowerCase().includes(campaignSearch.toLowerCase())
                        ).map((campaign) => (
                          <tr key={campaign._id}>
                            <td>
                              <span 
                                style={{ 
                                  color: '#3b82f6', 
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                                onClick={() => handleCampaignClick(campaign._id)}
                              >
                                {campaign.name}
                              </span>
                            </td>
                            <td>{campaign.assignedTo?.name || 'N/A'} ({campaign.assignedTo?.email || 'N/A'})</td>
                            <td>{campaign.leadCount || 0}</td>
                            <td>
                              <span style={{ 
                                textTransform: 'capitalize',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: 
                                  campaign.status === 'completed' ? '#d1fae5' : '#fee2e2',
                                color: 
                                  campaign.status === 'completed' ? '#065f46' : '#991b1b'
                              }}>
                                {campaign.status || 'pending'}
                              </span>
                            </td>
                            <td>
                              {user?.role === 'admin' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    className="btn-assign"
                                    onClick={() => handleAssignManager(campaign)}
                                    title="Assign to Manager"
                                  >
                                    Assign
                                  </button>
                                  <button
                                    className="btn-delete"
                                    onClick={() => handleDeleteClick(campaign)}
                                    title="Delete Campaign"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                              {user?.role === 'manager' && (
                                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>View Only</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* LEADS Tab */}
            {activeTab === 'leads' && (
              <div className="leads-tab-content">
                {/* Filters */}
                {user?.role === 'admin' && (
                  <div className="leads-filters">
                    <div className="filter-group">
                      <label>Campaign:</label>
                      <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                      >
                        <option value="">All Campaigns</option>
                        {campaigns.map(campaign => (
                          <option key={campaign._id} value={campaign._id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Manager:</label>
                      <select
                        value={selectedManager}
                        onChange={(e) => setSelectedManager(e.target.value)}
                      >
                        <option value="">All Managers</option>
                        {managers.map(manager => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {user?.role === 'manager' && campaigns.length > 0 && (
                  <div className="leads-filters">
                    <div className="filter-group">
                      <label>Campaign:</label>
                      <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                      >
                        <option value="">All Campaigns</option>
                        {campaigns.map(campaign => (
                          <option key={campaign._id} value={campaign._id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Leads Table */}
                {loadingLeads ? (
                  <div className="loading">Loading leads...</div>
                ) : leads.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>No leads found.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <div className="table-header">
                      <input
                        type="text"
                        placeholder="Search leads..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.675rem 0.9rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '5.4px',
                          fontSize: '0.84375rem',
                          outline: 'none'
                        }}
                      />
                      <div className="pagination-info" style={{ marginLeft: '1rem' }}>
                        Showing {leads.filter(lead => {
                          // Search filter
                          if (leadSearch) {
                            const searchLower = leadSearch.toLowerCase();
                            const matchesSearch = (
                              (lead.name || '').toLowerCase().includes(searchLower) ||
                              (lead.phone || '').toLowerCase().includes(searchLower) ||
                              (lead.email || '').toLowerCase().includes(searchLower) ||
                              (lead.instagram || '').toLowerCase().includes(searchLower) ||
                              (lead.facebook || '').toLowerCase().includes(searchLower)
                            );
                            if (!matchesSearch) return false;
                          }
                          
                          // Status filter
                          if (selectedStatusFilter && lead.status !== selectedStatusFilter) {
                            return false;
                          }
                          
                          // Remarks filter
                          if (selectedRemarksFilter === 'with') {
                            if (!lead.remarks || lead.remarks.length === 0) return false;
                          } else if (selectedRemarksFilter === 'without') {
                            if (lead.remarks && lead.remarks.length > 0) return false;
                          }
                          
                          return true;
                        }).length} of {leads.length}
                      </div>
                    </div>
                    <table className="leads-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone Number</th>
                          <th>Email</th>
                          <th>Instagram</th>
                          <th>Facebook</th>
                          <th className="filter-header" onClick={() => setShowStatusFilter(!showStatusFilter)}>
                            Status <span className="sort-icon">⇅</span>
                            {selectedStatusFilter && <span className="filter-indicator">●</span>}
                            {showStatusFilter && (
                              <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                                <div className="filter-option" onClick={() => {
                                  setSelectedStatusFilter('');
                                  setShowStatusFilter(false);
                                }}>
                                  All Statuses
                                </div>
                                <div 
                                  className={`filter-option ${selectedStatusFilter === 'pending' ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedStatusFilter(selectedStatusFilter === 'pending' ? '' : 'pending');
                                    setShowStatusFilter(false);
                                  }}
                                >
                                  Pending
                                </div>
                                <div 
                                  className={`filter-option ${selectedStatusFilter === 'contacted' ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedStatusFilter(selectedStatusFilter === 'contacted' ? '' : 'contacted');
                                    setShowStatusFilter(false);
                                  }}
                                >
                                  Contacted
                                </div>
                                <div 
                                  className={`filter-option ${selectedStatusFilter === 'hot' ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedStatusFilter(selectedStatusFilter === 'hot' ? '' : 'hot');
                                    setShowStatusFilter(false);
                                  }}
                                >
                                  Hot
                                </div>
                                <div 
                                  className={`filter-option ${selectedStatusFilter === 'NA' ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedStatusFilter(selectedStatusFilter === 'NA' ? '' : 'NA');
                                    setShowStatusFilter(false);
                                  }}
                                >
                                  NA
                                </div>
                              </div>
                            )}
                          </th>
                          <th className="filter-header" onClick={() => setShowRemarksFilter(!showRemarksFilter)}>
                            Remarks <span className="sort-icon">⇅</span>
                            {selectedRemarksFilter && <span className="filter-indicator">●</span>}
                            {showRemarksFilter && (
                              <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                                <div className="filter-option" onClick={() => {
                                  setSelectedRemarksFilter('');
                                  setShowRemarksFilter(false);
                                }}>
                                  All Remarks
                                </div>
                                <div 
                                  className={`filter-option ${selectedRemarksFilter === 'with' ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedRemarksFilter(selectedRemarksFilter === 'with' ? '' : 'with');
                                    setShowRemarksFilter(false);
                                  }}
                                >
                                  With Remarks
                                </div>
                                <div 
                                  className={`filter-option ${selectedRemarksFilter === 'without' ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedRemarksFilter(selectedRemarksFilter === 'without' ? '' : 'without');
                                    setShowRemarksFilter(false);
                                  }}
                                >
                                  Without Remarks
                                </div>
                              </div>
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.filter(lead => {
                          // Search filter
                          if (leadSearch) {
                            const searchLower = leadSearch.toLowerCase();
                            const matchesSearch = (
                              (lead.name || '').toLowerCase().includes(searchLower) ||
                              (lead.phone || '').toLowerCase().includes(searchLower) ||
                              (lead.email || '').toLowerCase().includes(searchLower) ||
                              (lead.instagram || '').toLowerCase().includes(searchLower) ||
                              (lead.facebook || '').toLowerCase().includes(searchLower)
                            );
                            if (!matchesSearch) return false;
                          }
                          
                          // Status filter
                          if (selectedStatusFilter && lead.status !== selectedStatusFilter) {
                            return false;
                          }
                          
                          // Remarks filter
                          if (selectedRemarksFilter === 'with') {
                            if (!lead.remarks || lead.remarks.length === 0) return false;
                          } else if (selectedRemarksFilter === 'without') {
                            if (lead.remarks && lead.remarks.length > 0) return false;
                          }
                          
                          return true;
                        }).map((lead) => (
                          <tr key={lead._id}>
                            <td>{lead.name || 'N/A'}</td>
                            <td>
                              {lead.phone && lead.phone !== 'N/A' ? (
                                <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {lead.email && lead.email !== 'N/A' ? (
                                <a href={`mailto:${lead.email}`}>{lead.email}</a>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {lead.instagram && lead.instagram !== 'N/A' ? (
                                <a href={lead.instagram} target="_blank" rel="noopener noreferrer">
                                  {lead.instagram.length > 30 ? `${lead.instagram.substring(0, 30)}...` : lead.instagram}
                                </a>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              {lead.facebook && lead.facebook !== 'N/A' ? (
                                <a href={lead.facebook} target="_blank" rel="noopener noreferrer">
                                  {lead.facebook.length > 30 ? `${lead.facebook.substring(0, 30)}...` : lead.facebook}
                                </a>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td>
                              <select
                                value={lead.status || 'pending'}
                                onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)}
                                style={{ padding: '0.25rem', fontSize: '0.875rem' }}
                              >
                                <option value="pending">Pending</option>
                                <option value="contacted">Contacted</option>
                                <option value="hot">Hot</option>
                                <option value="NA">NA</option>
                              </select>
                            </td>
                            <td>
                              {(!lead.remarks || lead.remarks.length === 0) ? (
                                <span 
                                  style={{ 
                                    color: '#3b82f6',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                  onClick={() => {
                                    setSelectedLeadForRemarks(lead);
                                    setIsRemarksModalOpen(true);
                                  }}
                                >
                                  --
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: '#3b82f6',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                  onClick={() => {
                                    setSelectedLeadForRemarks(lead);
                                    setIsRemarksModalOpen(true);
                                  }}
                                >
                                  remarks ({lead.remarks.length})
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Assign Manager Modal */}
            {showAssignModal && campaignToAssign && (
              <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Assign Campaign to Manager</h2>
                  <p><strong>Campaign:</strong> {campaignToAssign.name}</p>
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Manager:</label>
                    <select
                      value={newManagerId}
                      onChange={(e) => setNewManagerId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem' }}
                    >
                      <option value="">Select a manager</option>
                      {managers.map(manager => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name} ({manager.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowAssignModal(false)}>Cancel</button>
                    <button onClick={handleSubmitAssign} style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && campaignToDelete && (
              <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Delete Campaign</h2>
                  <p>Are you sure you want to delete the campaign <strong>"{campaignToDelete.name}"</strong>?</p>
                  <p style={{ color: '#c33', fontSize: '0.875rem' }}>This will also delete all leads associated with this campaign.</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    <button onClick={handleConfirmDelete} style={{ backgroundColor: '#ef4444', color: 'white' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Remarks Modal */}
            <RemarksModal
              isOpen={isRemarksModalOpen}
              onClose={(shouldRefresh) => {
                setIsRemarksModalOpen(false);
                setSelectedLeadForRemarks(null);
                if (shouldRefresh) {
                  loadLeads({ campaignId: selectedCampaign, managerId: selectedManager });
                }
              }}
              lead={selectedLeadForRemarks}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Campaigns;

