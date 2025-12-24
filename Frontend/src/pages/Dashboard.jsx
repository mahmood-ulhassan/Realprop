import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { dashboardService } from '../services/dashboardService';
import { leadService } from '../services/leadService';
import { projectService } from '../services/projectService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ContactModal from '../components/ContactModal';
import RemarksModal from '../components/RemarksModal';
import RequirementModal from '../components/RequirementModal';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [metrics, setMetrics] = useState({ contactsAdded: 0, chatsUpdated: 0, visits: 0 });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [selectedLeadForRemarks, setSelectedLeadForRemarks] = useState(null);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [selectedLeadForRequirement, setSelectedLeadForRequirement] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [referredFilter, setReferredFilter] = useState('');
  const [leadSourceFilter, setLeadSourceFilter] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [lastUpdateFilter, setLastUpdateFilter] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showReferredFilter, setShowReferredFilter] = useState(false);
  const [showLeadSourceFilter, setShowLeadSourceFilter] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showLastUpdateFilter, setShowLastUpdateFilter] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
      loadData(currentUser);
    }
  }, [navigate]);

  const loadData = async (currentUser) => {
    try {
      setLoading(true);
      
      // Load projects
      const projectsRes = await projectService.getProjects();
      setProjects(projectsRes.data);
      
      // For admin, select first project by default
      if (currentUser.role === 'admin' && projectsRes.data.length > 0) {
        setSelectedProject(projectsRes.data[0]._id);
        await loadMetrics(projectsRes.data[0]._id);
        await loadLeads(projectsRes.data[0]._id);
      } else if (currentUser.role === 'manager' && projectsRes.data.length > 0) {
        // For manager, use their assigned projects (they only see their own)
        // Select first project by default
        setSelectedProject(projectsRes.data[0]._id);
        await loadMetrics(projectsRes.data[0]._id);
        await loadLeads(projectsRes.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async (projectId, range = dateRange) => {
    try {
      const res = await dashboardService.getMetrics(projectId, range);
      setMetrics(res.data);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  const loadLeads = async (projectId) => {
    try {
      const res = await leadService.getLeads(projectId);
      setLeads(res.data);
    } catch (err) {
      console.error('Error loading leads:', err);
    }
  };

  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    await loadMetrics(projectId);
    await loadLeads(projectId);
  };

  const handleDateRangeChange = async (e) => {
    const range = e.target.value;
    setDateRange(range);
    if (selectedProject) {
      await loadMetrics(selectedProject);
    }
  };

  useEffect(() => {
    if (selectedProject && dateRange) {
      loadMetrics(selectedProject, dateRange);
    }
  }, [dateRange, selectedProject]);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-header') && !event.target.closest('.contact-header') && !event.target.closest('.contact-search-header')) {
        setShowStatusFilter(false);
        setShowReferredFilter(false);
        setShowLeadSourceFilter(false);
        if (!event.target.closest('.contact-search-input')) {
          // Keep contact search open if clicking inside the input
        }
      }
    };

    if (showStatusFilter || showReferredFilter || showLeadSourceFilter || showContactSearch) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showStatusFilter, showReferredFilter, showLeadSourceFilter, showContactSearch]);

  // Get unique values for filters
  const getUniqueStatuses = () => {
    const statuses = leads.map(lead => lead.status).filter(Boolean);
    return [...new Set(statuses)].sort();
  };

  const getUniqueReferred = () => {
    const referred = leads.map(lead => lead.referredBy).filter(Boolean);
    return [...new Set(referred)].sort();
  };

  const getUniqueLeadSources = () => {
    const sources = leads.map(lead => lead.leadSource).filter(Boolean);
    return [...new Set(sources)].sort();
  };

  // Normalize contact number for search (remove spaces, handle country codes)
  const normalizeContactNumber = (contactNo) => {
    if (!contactNo) return '';
    // Remove all spaces
    let normalized = contactNo.replace(/\s+/g, '');
    // Replace common country codes with 0 for easier searching
    // +92 -> 0, +1 -> 0, etc.
    normalized = normalized.replace(/^\+92/, '0');
    normalized = normalized.replace(/^\+1/, '0');
    normalized = normalized.replace(/^\+44/, '0');
    normalized = normalized.replace(/^\+91/, '0');
    normalized = normalized.replace(/^\+971/, '0');
    return normalized.toLowerCase();
  };

  // Check if lead's lastUpdatedAt matches the date filter
  const matchesLastUpdateFilter = (lead) => {
    if (!lastUpdateFilter) return true;
    
    const leadDate = new Date(lead.lastUpdatedAt || lead.updatedAt || lead.createdAt);
    if (isNaN(leadDate.getTime())) return false; // Invalid date
    
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    switch (lastUpdateFilter) {
      case 'today':
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        return leadDate >= todayStart && leadDate <= todayEnd;
      
      case 'lastweek':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);
        return leadDate >= lastWeekStart && leadDate <= now;
      
      case 'lastmonth':
        const lastMonthStart = new Date(now);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setHours(0, 0, 0, 0);
        return leadDate >= lastMonthStart && leadDate <= now;
      
      case 'custom':
        if (!customDateFrom || !customDateTo) return true;
        const fromDate = new Date(customDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(customDateTo);
        toDate.setHours(23, 59, 59, 999);
        return leadDate >= fromDate && leadDate <= toDate;
      
      default:
        return true;
    }
  };

  // Filter leads based on active filters
  const filteredLeads = leads.filter(lead => {
    if (statusFilter && lead.status !== statusFilter) return false;
    if (referredFilter && lead.referredBy !== referredFilter) return false;
    if (leadSourceFilter && lead.leadSource !== leadSourceFilter) return false;
    if (contactSearch) {
      const normalizedSearch = normalizeContactNumber(contactSearch);
      const normalizedContact = normalizeContactNumber(lead.contactNo);
      if (!normalizedContact.includes(normalizedSearch)) return false;
    }
    if (!matchesLastUpdateFilter(lead)) return false;
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      'fresh': '#3b82f6', // blue
      'new': '#3b82f6',
      'contacted': '#10b981', // green
      'requirement': '#f59e0b', // orange
      'hot': '#ef4444', // red
      'offer given': '#8b5cf6', // purple
      'visit planned': '#06b6d4', // cyan
      'visited': '#06b6d4',
      'closed': '#6b7280', // gray
      'success': '#10b981', // green
      'not interes': '#ef4444', // red
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const getLatestRemark = (lead) => {
    if (!lead.remarks || lead.remarks.length === 0) return '';
    const latest = lead.remarks[lead.remarks.length - 1];
    return latest.text || '';
  };

  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  const selectedProjectName = projects.find(p => p._id === selectedProject)?.name || 'Select Project';

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-main ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Dashboard" sidebarOpen={sidebarOpen} />
        
        <main className="dashboard-content">
          {/* Project Selector and Date Range */}
          <div className="filters-bar">
            {(user.role === 'admin' || (user.role === 'manager' && projects.length > 1)) && (
              <select 
                value={selectedProject || ''} 
                onChange={handleProjectChange}
                className="project-dropdown"
              >
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
            <select 
              value={dateRange} 
              onChange={handleDateRangeChange} 
              className="date-select"
            >
              <option value="today">Today</option>
              <option value="thisweek">This Week</option>
              <option value="thismonth">This Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">👤</div>
              <div className="metric-content">
                <div className="metric-value">{metrics.contactsAdded}</div>
                <div className="metric-label">Contacts Added</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">💬</div>
              <div className="metric-content">
                <div className="metric-value">{metrics.chatsUpdated}</div>
                <div className="metric-label">Chats Updated</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">🏢</div>
              <div className="metric-content">
                <div className="metric-value">{metrics.visits}</div>
                <div className="metric-label">Visits</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-primary" onClick={() => {
              setEditingLead(null);
              setIsModalOpen(true);
            }}>
           Add New Contact
            </button>
            <button className="btn-secondary">
              <span>⬇</span> Export
            </button>
          </div>

          {/* Leads Table */}
          <div className="table-container">
            <div className="table-header">
              <div className="pagination-info">
                Showing {filteredLeads.length} of {leads.length}
              </div>
            </div>

            <table className="leads-table">
              <thead>
                <tr>
                  <th className="col-name">Name</th>
                  <th className="col-contact contact-header" onClick={() => setShowContactSearch(!showContactSearch)}>
                    Contact No <span className="sort-icon">⇅</span>
                    {contactSearch && <span className="filter-indicator">●</span>}
                  </th>
                  <th className="col-requirement text-center">Requirement</th>
                  <th className="col-status filter-header" onClick={() => setShowStatusFilter(!showStatusFilter)}>
                    Status <span className="sort-icon">⇅</span>
                    {statusFilter && <span className="filter-indicator">●</span>}
                    {showStatusFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setStatusFilter('')}>
                          All Status
                        </div>
                        {getUniqueStatuses().map(status => (
                          <div 
                            key={status} 
                            className={`filter-option ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => {
                              setStatusFilter(statusFilter === status ? '' : status);
                              setShowStatusFilter(false);
                            }}
                          >
                            {status}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="col-update last-update-filter-header" onClick={() => setShowLastUpdateFilter(!showLastUpdateFilter)}>
                    Last Update<span className="sort-icon">⇅</span>
                    {lastUpdateFilter && <span className="filter-indicator">●</span>}
                    {showLastUpdateFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className={`filter-option ${lastUpdateFilter === 'today' ? 'active' : ''}`}
                          onClick={() => {
                            setLastUpdateFilter('today');
                            setShowCustomDatePicker(false);
                            setShowLastUpdateFilter(false);
                          }}
                        >
                          Today
                        </div>
                        <div 
                          className={`filter-option ${lastUpdateFilter === 'lastweek' ? 'active' : ''}`}
                          onClick={() => {
                            setLastUpdateFilter('lastweek');
                            setShowCustomDatePicker(false);
                            setShowLastUpdateFilter(false);
                          }}
                        >
                          Last Week
                        </div>
                        <div 
                          className={`filter-option ${lastUpdateFilter === 'lastmonth' ? 'active' : ''}`}
                          onClick={() => {
                            setLastUpdateFilter('lastmonth');
                            setShowCustomDatePicker(false);
                            setShowLastUpdateFilter(false);
                          }}
                        >
                          Last Month
                        </div>
                        <div 
                          className={`filter-option ${lastUpdateFilter === 'custom' ? 'active' : ''}`}
                          onClick={() => {
                            setLastUpdateFilter('custom');
                            setShowCustomDatePicker(true);
                          }}
                        >
                          Custom
                        </div>
                        {lastUpdateFilter && (
                          <>
                            <div className="filter-divider"></div>
                            <div 
                              className="filter-option"
                              onClick={() => {
                                setLastUpdateFilter('');
                                setCustomDateFrom('');
                                setCustomDateTo('');
                                setShowCustomDatePicker(false);
                                setShowLastUpdateFilter(false);
                              }}
                            >
                              Clear Filter
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {showCustomDatePicker && lastUpdateFilter === 'custom' && (
                      <div className="custom-date-picker" onClick={(e) => e.stopPropagation()}>
                        <div className="date-picker-row">
                          <label>From:</label>
                          <input
                            type="date"
                            value={customDateFrom}
                            onChange={(e) => setCustomDateFrom(e.target.value)}
                          />
                        </div>
                        <div className="date-picker-row">
                          <label>To:</label>
                          <input
                            type="date"
                            value={customDateTo}
                            onChange={(e) => setCustomDateTo(e.target.value)}
                          />
                        </div>
                        <div className="date-picker-actions">
                          <button
                            className="date-picker-apply"
                            onClick={() => {
                              if (customDateFrom && customDateTo) {
                                setShowCustomDatePicker(false);
                                setShowLastUpdateFilter(false);
                              }
                            }}
                          >
                            Apply
                          </button>
                          <button
                            className="date-picker-cancel"
                            onClick={() => {
                              setLastUpdateFilter('');
                              setCustomDateFrom('');
                              setCustomDateTo('');
                              setShowCustomDatePicker(false);
                              setShowLastUpdateFilter(false);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </th>
                  <th className="col-remark text-center">Latest Remark</th>
                  <th className="col-referred filter-header" onClick={() => setShowReferredFilter(!showReferredFilter)}>
                    Referred <span className="sort-icon">⇅</span>
                    {referredFilter && <span className="filter-indicator">●</span>}
                    {showReferredFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setReferredFilter('')}>
                          All Referred
                        </div>
                        {getUniqueReferred().map(referred => (
                          <div 
                            key={referred} 
                            className={`filter-option ${referredFilter === referred ? 'active' : ''}`}
                            onClick={() => {
                              setReferredFilter(referredFilter === referred ? '' : referred);
                              setShowReferredFilter(false);
                            }}
                          >
                            {referred}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="col-source filter-header" onClick={() => setShowLeadSourceFilter(!showLeadSourceFilter)}>
                    Lead Source <span className="sort-icon">⇅</span>
                    {leadSourceFilter && <span className="filter-indicator">●</span>}
                    {showLeadSourceFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setLeadSourceFilter('')}>
                          All Lead Sources
                        </div>
                        {getUniqueLeadSources().map(source => (
                          <div 
                            key={source} 
                            className={`filter-option ${leadSourceFilter === source ? 'active' : ''}`}
                            onClick={() => {
                              setLeadSourceFilter(leadSourceFilter === source ? '' : source);
                              setShowLeadSourceFilter(false);
                            }}
                          >
                            {source}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="col-actions">Actions</th>
                </tr>
                {showContactSearch && (
                  <tr className="contact-search-row">
                    <td colSpan="9" className="contact-search-cell">
                      <div className="contact-search-wrapper">
                        <input
                          type="text"
                          className="contact-search-input"
                          placeholder="Search by contact number..."
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        <button
                          className="contact-search-close"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactSearch('');
                            setShowContactSearch(false);
                          }}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="no-data">No leads found</td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead._id}>
                      <td className="col-name">
                        {lead.name}
                      </td>
                      <td className="col-contact">{lead.contactNo}</td>
                      <td 
                        className="col-requirement requirement-cell" 
                        title={lead.requirement || ''}
                        onClick={() => {
                          setSelectedLeadForRequirement(lead);
                          setIsRequirementModalOpen(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {lead.requirement || '-'}
                      </td>
                      <td className="col-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(lead.status) }}
                        >
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td className="col-update">{formatDate(lead.lastUpdatedAt)}</td>
                      <td className="col-remark">
                        <button 
                          className="remark-link"
                          onClick={() => {
                            setSelectedLeadForRemarks(lead);
                            setIsRemarksModalOpen(true);
                          }}
                        >
                          {getLatestRemark(lead) || '-'}
                        </button>
                      </td>
                      <td className="col-referred">{lead.referredBy || '-'}</td>
                      <td className="col-source">{lead.leadSource || '-'}</td>
                      <td className="col-actions">
                        <button className="edit-button" onClick={() => {
                          setEditingLead(lead);
                          setIsModalOpen(true);
                        }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="table-footer">
              <div className="pagination-info-footer">
                Showing {filteredLeads.length} of {leads.length}
                {(statusFilter || referredFilter || leadSourceFilter || contactSearch || lastUpdateFilter) && (
                  <span className="filter-info">
                    {' '}(filtered)
                    <button 
                      className="clear-filters-btn"
                      onClick={() => {
                        setStatusFilter('');
                        setReferredFilter('');
                        setLeadSourceFilter('');
                        setContactSearch('');
                        setLastUpdateFilter('');
                        setCustomDateFrom('');
                        setCustomDateTo('');
                        setShowContactSearch(false);
                        setShowCustomDatePicker(false);
                      }}
                    >
                      Clear filters
                    </button>
                  </span>
                )}
              </div>
              <div className="pagination-controls">
                <button disabled={currentPage === 1}>← Previous</button>
                <button className="page-number active">{currentPage}</button>
                <button disabled={leads.length < 10}>Next →</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
        }}
        lead={editingLead}
        projectId={selectedProject}
        onSuccess={() => {
          if (selectedProject) {
            loadLeads(selectedProject);
            loadMetrics(selectedProject, dateRange);
          }
        }}
      />

      {/* Remarks Modal */}
      <RemarksModal
        isOpen={isRemarksModalOpen}
        onClose={(shouldRefresh) => {
          setIsRemarksModalOpen(false);
          if (shouldRefresh && selectedProject) {
            loadLeads(selectedProject);
            loadMetrics(selectedProject, dateRange);
          }
          setSelectedLeadForRemarks(null);
        }}
        lead={selectedLeadForRemarks}
      />

      {/* Requirement Modal */}
      <RequirementModal
        isOpen={isRequirementModalOpen}
        onClose={() => {
          setIsRequirementModalOpen(false);
          setSelectedLeadForRequirement(null);
        }}
        lead={selectedLeadForRequirement}
      />
    </div>
  );
}

export default Dashboard;
