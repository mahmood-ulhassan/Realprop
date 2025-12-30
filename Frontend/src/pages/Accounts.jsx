import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import accountsService from '../services/accountsService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Accounts.css';
import './Dashboard.css';

function Accounts() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dateRange, setDateRange] = useState('thisMonth');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalLoans: 0,
    totalIncomingLoans: 0,
    totalOutgoingLoans: 0,
    totalPayouts: 0
  });
  const [showLoansModal, setShowLoansModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [modes, setModes] = useState(['Cash']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balances, setBalances] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'income',
    mode: 'Cash',
    category: '',
    description: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [newMode, setNewMode] = useState('');
  const [showAddModeInput, setShowAddModeInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  
  // Filter states
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showModeFilter, setShowModeFilter] = useState(false);
  const [showAmountFilter, setShowAmountFilter] = useState(false);
  
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
      loadProjects();
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedProject) {
      loadSummary();
      loadAccounts();
      loadCategories();
    }
    loadModes();
  }, [selectedProject, dateRange, customDateFrom, customDateTo]);

  const loadProjects = async () => {
    try {
      const response = await projectService.getProjects();
      setProjects(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedProject(response.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last6Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'custom':
        if (customDateFrom && customDateTo) {
          startDate = new Date(customDateFrom);
          endDate = new Date(customDateTo);
          endDate.setHours(23, 59, 59);
        } else {
          return { startDate: null, endDate: null };
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return { startDate, endDate };
  };

  const loadSummary = async () => {
    if (!selectedProject) return;
    
    try {
      const { startDate, endDate } = getDateRange();
      if (!startDate || !endDate) return;

      const filters = {
        projectId: selectedProject,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      const data = await accountsService.getAccountSummary(filters);
      setSummary(data);
    } catch (err) {
      console.error('Error loading summary:', err);
      setError('Failed to load account summary');
    }
  };

  const loadAccounts = async () => {
    if (!selectedProject) return;
    
    setLoadingAccounts(true);
    try {
      const { startDate, endDate } = getDateRange();
      if (!startDate || !endDate) {
        setLoadingAccounts(false);
        return;
      }

      const filters = {
        projectId: selectedProject,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      const data = await accountsService.getAccounts(filters);
      setAccounts(data);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadCategories = async () => {
    if (!selectedProject) return;
    
    try {
      const data = await accountsService.getCategories(selectedProject);
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadModes = async () => {
    try {
      const data = await accountsService.getModes();
      if (data && data.length > 0) {
        setModes(data);
      } else {
        setModes(['Cash']); // Default to Cash if no modes exist
      }
    } catch (err) {
      console.error('Error loading modes:', err);
      setModes(['Cash']); // Default to Cash on error
    }
  };

  const loadBalance = async () => {
    setLoadingBalance(true);
    try {
      const data = await accountsService.getBalance();
      setBalances(data);
    } catch (err) {
      console.error('Error loading balance:', err);
      setError('Failed to load balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleCheckBalance = () => {
    loadBalance();
    setShowBalanceModal(true);
  };

  const handleAddMode = () => {
    if (newMode.trim() && !modes.includes(newMode.trim())) {
      setModes([...modes, newMode.trim()]);
      setNewEntry({ ...newEntry, mode: newMode.trim() });
      setNewMode('');
      setShowAddModeInput(false);
    }
  };

  const handleSaveMode = () => {
    handleAddMode();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const truncateDescription = (text, maxLength = 50) => {
    if (!text || text === 'N/A') return text;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDescriptionClick = (description) => {
    if (description && description !== 'N/A' && description.length > 50) {
      setSelectedDescription(description);
      setShowDescriptionModal(true);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.date || !newEntry.amount || !newEntry.type || !newEntry.mode || !newEntry.category) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await accountsService.createAccount({
        projectId: selectedProject,
        date: newEntry.date,
        amount: parseFloat(newEntry.amount),
        type: newEntry.type,
        mode: newEntry.mode.trim(),
        category: newEntry.category.trim(),
        description: newEntry.description.trim()
      });

      // Reset form
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'income',
        mode: 'Cash',
        category: '',
        description: ''
      });
      setNewCategory('');
      setNewMode('');
      setShowAddModal(false);

      // Reload data
      loadSummary();
      loadAccounts();
      loadCategories();
      loadModes();
    } catch (err) {
      console.error('Error adding account entry:', err);
      setError(err.response?.data?.message || 'Failed to add account entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewEntry({ ...newEntry, category: newCategory.trim() });
      setNewCategory('');
    }
  };

  // Handle click outside to close filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-header') && !event.target.closest('.filter-dropdown')) {
        setShowDateFilter(false);
        setShowTypeFilter(false);
        setShowCategoryFilter(false);
        setShowModeFilter(false);
        setShowAmountFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unique values for filters
  const getUniqueCategories = () => {
    return [...new Set(accounts.map(a => a.category))].sort();
  };

  const getUniqueModes = () => {
    return [...new Set(accounts.map(a => a.mode || 'Cash'))].sort();
  };

  // Filter accounts based on selected filters
  const getFilteredAccounts = () => {
    return accounts.filter(account => {
      // Date filter
      if (dateFilter.from || dateFilter.to) {
        const accountDate = new Date(account.date);
        if (dateFilter.from && accountDate < new Date(dateFilter.from)) return false;
        if (dateFilter.to && accountDate > new Date(dateFilter.to)) return false;
      }

      // Type filter
      if (typeFilter && account.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter && account.category !== categoryFilter) return false;

      // Mode filter
      if (modeFilter && (account.mode || 'Cash') !== modeFilter) return false;

      // Amount filter
      if (amountFilter.min && account.amount < parseFloat(amountFilter.min)) return false;
      if (amountFilter.max && account.amount > parseFloat(amountFilter.max)) return false;

      return true;
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return !!(dateFilter.from || dateFilter.to || typeFilter || categoryFilter || modeFilter || amountFilter.min || amountFilter.max);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setDateFilter({ from: '', to: '' });
    setTypeFilter('');
    setCategoryFilter('');
    setModeFilter('');
    setAmountFilter({ min: '', max: '' });
    setShowDateFilter(false);
    setShowTypeFilter(false);
    setShowCategoryFilter(false);
    setShowModeFilter(false);
    setShowAmountFilter(false);
  };

  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-main ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Accounts" sidebarOpen={sidebarOpen} />
        
        <main className="dashboard-content">
          <div className="accounts-container">
            {/* Filters Bar */}
            <div className="filters-bar">
              <select
                className="project-dropdown"
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <select
                className="date-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="thisMonth">This Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="last6Months">Last 6 Months</option>
                <option value="lastYear">Last Year</option>
                <option value="custom">Custom</option>
              </select>

              {dateRange === 'custom' && (
                <>
                  <input
                    type="date"
                    className="date-select"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    placeholder="From Date"
                  />
                  <input
                    type="date"
                    className="date-select"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    placeholder="To Date"
                  />
                </>
              )}
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

            {/* Summary Cards */}
            {selectedProject && (
              <>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-content">
                      <div className="metric-value">{formatCurrency(summary.totalIncome)}</div>
                      <div className="metric-label">Total Income</div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-content">
                      <div className="metric-value">{formatCurrency(summary.totalExpenses)}</div>
                      <div className="metric-label">Total Expenses</div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-content">
                      <div className="metric-value" style={{ color: summary.totalProfit >= 0 ? '#065f46' : '#991b1b' }}>
                        {formatCurrency(summary.totalProfit)}
                      </div>
                      <div className="metric-label">Total Profit</div>
                    </div>
                  </div>

                  <div 
                    className="metric-card"
                    onClick={() => setShowLoansModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="metric-content">
                      <div className="metric-value" style={{ color: summary.totalLoans >= 0 ? '#065f46' : '#991b1b' }}>
                        {formatCurrency(summary.totalLoans)}
                      </div>
                      <div className="metric-label">Net Loans</div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-content">
                      <div className="metric-value">{formatCurrency(summary.totalPayouts)}</div>
                      <div className="metric-label">Total Payouts</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    Add Entry
                  </button>
                  <button className="btn-secondary" onClick={handleCheckBalance}>
                    Check Balance
                  </button>
                </div>

                {/* Accounts Table */}
                <div className="table-container">
                  <div className="table-header">
                    <div className="pagination-info">
                      Showing {getFilteredAccounts().length} of {accounts.length} {hasActiveFilters() && '(filtered)'} {hasActiveFilters() && (
                        <span 
                          onClick={handleClearFilters}
                          style={{
                            color: '#2563eb',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            marginLeft: '0.5rem'
                          }}
                        >
                          Clear filters
                        </span>
                      )}
                    </div>
                  </div>
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th className="filter-header" onClick={() => setShowDateFilter(!showDateFilter)}>
                          Date <span className="sort-icon">⇅</span>
                          {(dateFilter.from || dateFilter.to) && <span className="filter-indicator">●</span>}
                          {showDateFilter && (
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()} style={{ minWidth: '250px', padding: '0.75rem' }}>
                              <div style={{ marginBottom: '0.75rem', borderBottom: '1px solid #e9ecef', paddingBottom: '0.75rem' }}>
                                <div className="filter-option" onClick={() => {
                                  const now = new Date();
                                  const endDate = new Date(now);
                                  endDate.setHours(23, 59, 59);
                                  const startDate = new Date(now);
                                  startDate.setDate(startDate.getDate() - 6);
                                  startDate.setHours(0, 0, 0, 0);
                                  setDateFilter({ 
                                    from: startDate.toISOString().split('T')[0], 
                                    to: endDate.toISOString().split('T')[0] 
                                  });
                                  setShowDateFilter(false);
                                }}>
                                  Last 7 Days
                                </div>
                                <div className="filter-option" onClick={() => {
                                  const now = new Date();
                                  const endDate = new Date(now);
                                  endDate.setHours(23, 59, 59);
                                  const startDate = new Date(now);
                                  startDate.setDate(startDate.getDate() - 29);
                                  startDate.setHours(0, 0, 0, 0);
                                  setDateFilter({ 
                                    from: startDate.toISOString().split('T')[0], 
                                    to: endDate.toISOString().split('T')[0] 
                                  });
                                  setShowDateFilter(false);
                                }}>
                                  Last 30 Days
                                </div>
                                <div className="filter-option" onClick={() => {
                                  const now = new Date();
                                  const endDate = new Date(now);
                                  endDate.setHours(23, 59, 59);
                                  const startDate = new Date(now);
                                  startDate.setDate(startDate.getDate() - 89);
                                  startDate.setHours(0, 0, 0, 0);
                                  setDateFilter({ 
                                    from: startDate.toISOString().split('T')[0], 
                                    to: endDate.toISOString().split('T')[0] 
                                  });
                                  setShowDateFilter(false);
                                }}>
                                  Last 90 Days
                                </div>
                              </div>
                              <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#6b7280' }}>From Date</label>
                                <input
                                  type="date"
                                  value={dateFilter.from}
                                  onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </div>
                              <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#6b7280' }}>To Date</label>
                                <input
                                  type="date"
                                  value={dateFilter.to}
                                  onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  setDateFilter({ from: '', to: '' });
                                  setShowDateFilter(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem',
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </th>
                        <th className="filter-header" onClick={() => setShowTypeFilter(!showTypeFilter)}>
                          Type <span className="sort-icon">⇅</span>
                          {typeFilter && <span className="filter-indicator">●</span>}
                          {showTypeFilter && (
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-option" onClick={() => {
                                setTypeFilter('');
                                setShowTypeFilter(false);
                              }}>
                                All Types
                              </div>
                              <div className={`filter-option ${typeFilter === 'income' ? 'active' : ''}`} onClick={() => {
                                setTypeFilter(typeFilter === 'income' ? '' : 'income');
                                setShowTypeFilter(false);
                              }}>
                                Income
                              </div>
                              <div className={`filter-option ${typeFilter === 'expense' ? 'active' : ''}`} onClick={() => {
                                setTypeFilter(typeFilter === 'expense' ? '' : 'expense');
                                setShowTypeFilter(false);
                              }}>
                                Expense
                              </div>
                              <div className={`filter-option ${typeFilter === 'incomingLoan' ? 'active' : ''}`} onClick={() => {
                                setTypeFilter(typeFilter === 'incomingLoan' ? '' : 'incomingLoan');
                                setShowTypeFilter(false);
                              }}>
                                Incoming Loan
                              </div>
                              <div className={`filter-option ${typeFilter === 'outgoingLoan' ? 'active' : ''}`} onClick={() => {
                                setTypeFilter(typeFilter === 'outgoingLoan' ? '' : 'outgoingLoan');
                                setShowTypeFilter(false);
                              }}>
                                Outgoing Loan
                              </div>
                              <div className={`filter-option ${typeFilter === 'payout' ? 'active' : ''}`} onClick={() => {
                                setTypeFilter(typeFilter === 'payout' ? '' : 'payout');
                                setShowTypeFilter(false);
                              }}>
                                Payout
                              </div>
                            </div>
                          )}
                        </th>
                        <th className="filter-header" onClick={() => setShowCategoryFilter(!showCategoryFilter)}>
                          Category <span className="sort-icon">⇅</span>
                          {categoryFilter && <span className="filter-indicator">●</span>}
                          {showCategoryFilter && (
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '250px', overflowY: 'auto' }}>
                              <div className="filter-option" onClick={() => {
                                setCategoryFilter('');
                                setShowCategoryFilter(false);
                              }}>
                                All Categories
                              </div>
                              {getUniqueCategories().map(cat => (
                                <div
                                  key={cat}
                                  className={`filter-option ${categoryFilter === cat ? 'active' : ''}`}
                                  onClick={() => {
                                    setCategoryFilter(categoryFilter === cat ? '' : cat);
                                    setShowCategoryFilter(false);
                                  }}
                                >
                                  {cat}
                                </div>
                              ))}
                            </div>
                          )}
                        </th>
                        <th className="filter-header" onClick={() => setShowModeFilter(!showModeFilter)}>
                          Mode <span className="sort-icon">⇅</span>
                          {modeFilter && <span className="filter-indicator">●</span>}
                          {showModeFilter && (
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '250px', overflowY: 'auto' }}>
                              <div className="filter-option" onClick={() => {
                                setModeFilter('');
                                setShowModeFilter(false);
                              }}>
                                All Modes
                              </div>
                              {getUniqueModes().map(mode => (
                                <div
                                  key={mode}
                                  className={`filter-option ${modeFilter === mode ? 'active' : ''}`}
                                  onClick={() => {
                                    setModeFilter(modeFilter === mode ? '' : mode);
                                    setShowModeFilter(false);
                                  }}
                                >
                                  {mode}
                                </div>
                              ))}
                            </div>
                          )}
                        </th>
                        <th className="filter-header" onClick={() => setShowAmountFilter(!showAmountFilter)}>
                          Amount <span className="sort-icon">⇅</span>
                          {(amountFilter.min || amountFilter.max) && <span className="filter-indicator">●</span>}
                          {showAmountFilter && (
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()} style={{ minWidth: '200px', padding: '0.75rem' }}>
                              <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#6b7280' }}>Min Amount</label>
                                <input
                                  type="number"
                                  value={amountFilter.min}
                                  onChange={(e) => setAmountFilter({ ...amountFilter, min: e.target.value })}
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </div>
                              <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#6b7280' }}>Max Amount</label>
                                <input
                                  type="number"
                                  value={amountFilter.max}
                                  onChange={(e) => setAmountFilter({ ...amountFilter, max: e.target.value })}
                                  placeholder="No limit"
                                  min="0"
                                  step="0.01"
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  setAmountFilter({ min: '', max: '' });
                                  setShowAmountFilter(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem',
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingAccounts ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                            Loading...
                          </td>
                        </tr>
                      ) : accounts.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                            No account entries found
                          </td>
                        </tr>
                      ) : getFilteredAccounts().length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                            No entries match the selected filters
                          </td>
                        </tr>
                      ) : (
                        getFilteredAccounts().map((account) => (
                          <tr key={account._id}>
                            <td>{formatDate(account.date)}</td>
                            <td>
                              <span style={{
                                textTransform: 'capitalize',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: 
                                  account.type === 'income' ? '#d1fae5' :
                                  account.type === 'expense' ? '#fee2e2' :
                                  account.type === 'incomingLoan' ? '#fef3c7' :
                                  account.type === 'outgoingLoan' ? '#dbeafe' :
                                  '#e0e7ff',
                                color: 
                                  account.type === 'income' ? '#065f46' :
                                  account.type === 'expense' ? '#991b1b' :
                                  account.type === 'incomingLoan' ? '#92400e' :
                                  account.type === 'outgoingLoan' ? '#1e40af' :
                                  '#3730a3'
                              }}>
                                {account.type === 'incomingLoan' ? 'Incoming Loan' : 
                                 account.type === 'outgoingLoan' ? 'Outgoing Loan' : 
                                 account.type}
                              </span>
                            </td>
                            <td>{account.category}</td>
                            <td>{account.mode || 'Cash'}</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(account.amount)}</td>
                            <td>
                              {account.description && account.description !== 'N/A' && account.description.length > 50 ? (
                                <span
                                  onClick={() => handleDescriptionClick(account.description)}
                                  style={{
                                    cursor: 'pointer',
                                    color: '#2563eb',
                                    textDecoration: 'underline'
                                  }}
                                  title="Click to view full description"
                                >
                                  {truncateDescription(account.description)}
                                </span>
                              ) : (
                                account.description || 'N/A'
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!selectedProject && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Please select a project to view accounts</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Account Entry</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Type *
                </label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="incomingLoan">Incoming Loan</option>
                  <option value="outgoingLoan">Outgoing Loan</option>
                  <option value="payout">Payout</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Mode *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={newEntry.mode}
                    onChange={(e) => setNewEntry({ ...newEntry, mode: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select or add mode</option>
                    {modes.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddModeInput(!showAddModeInput)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ADD
                  </button>
                </div>
                {showAddModeInput && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="e.g., Bank Al-Habib-- Account number"
                      value={newMode}
                      onChange={(e) => setNewMode(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveMode();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveMode}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModeInput(false);
                        setNewMode('');
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Category *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select or add category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Add new category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCategory();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Amount *
                </label>
                <input
                  type="number"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="Optional description"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEntry({
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    type: 'income',
                    mode: 'Cash',
                    category: '',
                    description: ''
                  });
                  setNewCategory('');
                  setNewMode('');
                  setShowAddModeInput(false);
                  setError('');
                }}
                disabled={isSubmitting}
                style={{
                  padding: '0.5rem 1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                disabled={isSubmitting}
                style={{
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: isSubmitting ? '#ccc' : '#2563eb',
                  color: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Adding...' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Modal */}
      {showBalanceModal && (
        <div className="modal-overlay" onClick={() => setShowBalanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Account Balance</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              All-time balance across all projects
            </p>
            
            {loadingBalance ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : balances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>No accounts found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {balances.map((item) => (
                  <div
                    key={item.mode}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                      {item.mode}
                    </span>
                    <span
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: item.balance >= 0 ? '#065f46' : '#991b1b'
                      }}
                    >
                      {formatCurrency(item.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowBalanceModal(false)}
                style={{
                  padding: '0.5rem 1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="modal-overlay" onClick={() => setShowDescriptionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Description</h2>
            <div style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              minHeight: '100px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              color: '#374151',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              {selectedDescription}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDescriptionModal(false)}
                style={{
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loans Modal */}
      {showLoansModal && (
        <div className="modal-overlay" onClick={() => setShowLoansModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Loan Details</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Loan breakdown for selected period
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                  Total Incoming Loans
                </span>
                <span
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#991b1b'
                  }}
                >
                  {formatCurrency(summary.totalIncomingLoans)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                  Total Outgoing Loans
                </span>
                <span
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#065f46'
                  }}
                >
                  {formatCurrency(summary.totalOutgoingLoans)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLoansModal(false)}
                style={{
                  padding: '0.5rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Accounts;

