import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import inventoryService from '../services/inventoryService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import InventoryModal from '../components/InventoryModal';
import NotesModal from '../components/NotesModal';
import './Dashboard.css';
import './Inventory.css';

function Inventory() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [offeredByFilter, setOfferedByFilter] = useState('');
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showFloorFilter, setShowFloorFilter] = useState(false);
  const [showOfferedByFilter, setShowOfferedByFilter] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'admin') {
      // Only admins can access inventory page
      navigate('/dashboard');
    } else {
      setUser(currentUser);
      loadData();
    }
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAll();
      setInventory(data);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      await inventoryService.delete(itemId);
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get unique values for filters (from inventory + localStorage saved options)
  const getUniqueLocations = () => {
    // Get from inventory
    const inventoryLocations = inventory.map(item => item.location).filter(Boolean);
    
    // Get from localStorage (saved dropdown options)
    const savedLocations = localStorage.getItem('inventoryLocationOptions');
    let savedLocationsArray = [];
    if (savedLocations) {
      try {
        savedLocationsArray = JSON.parse(savedLocations);
      } catch (e) {
        console.error('Error parsing saved locations:', e);
      }
    }
    
    // Combine and deduplicate
    const allLocations = [...inventoryLocations, ...savedLocationsArray];
    return [...new Set(allLocations)].sort();
  };

  const getUniqueTypes = () => {
    // Get from inventory
    const inventoryTypes = inventory.map(item => item.type).filter(Boolean);
    
    // Get from localStorage (saved dropdown options)
    const savedTypes = localStorage.getItem('inventoryTypeOptions');
    let savedTypesArray = [];
    if (savedTypes) {
      try {
        savedTypesArray = JSON.parse(savedTypes);
      } catch (e) {
        console.error('Error parsing saved types:', e);
      }
    }
    
    // Combine and deduplicate
    const allTypes = [...inventoryTypes, ...savedTypesArray];
    return [...new Set(allTypes)].sort();
  };

  const getUniqueFloors = () => {
    // Get from inventory
    const inventoryFloors = inventory.map(item => item.floor).filter(Boolean);
    
    // Get from localStorage (saved dropdown options)
    const savedFloors = localStorage.getItem('inventoryFloorOptions');
    let savedFloorsArray = [];
    if (savedFloors) {
      try {
        savedFloorsArray = JSON.parse(savedFloors);
      } catch (e) {
        console.error('Error parsing saved floors:', e);
      }
    }
    
    // Combine and deduplicate
    const allFloors = [...inventoryFloors, ...savedFloorsArray];
    return [...new Set(allFloors)].sort();
  };

  const getUniqueOfferedBy = () => {
    // Get from inventory
    const inventoryOfferedBy = inventory.map(item => item.reofferedBy).filter(Boolean);
    
    // Get from localStorage (saved dropdown options)
    const savedOfferedBy = localStorage.getItem('inventoryReofferedOptions');
    let savedOfferedByArray = [];
    if (savedOfferedBy) {
      try {
        savedOfferedByArray = JSON.parse(savedOfferedBy);
      } catch (e) {
        console.error('Error parsing saved offered by:', e);
      }
    }
    
    // Combine and deduplicate
    const allOfferedBy = [...inventoryOfferedBy, ...savedOfferedByArray];
    return [...new Set(allOfferedBy)].sort();
  };

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-header')) {
        setShowLocationFilter(false);
        setShowTypeFilter(false);
        setShowFloorFilter(false);
        setShowOfferedByFilter(false);
      }
    };

    if (showLocationFilter || showTypeFilter || showFloorFilter || showOfferedByFilter) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showLocationFilter, showTypeFilter, showFloorFilter, showOfferedByFilter]);

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const notesText = item.notes && Array.isArray(item.notes) 
        ? item.notes.map(n => n.text || '').join(' ').toLowerCase()
        : '';
      const matchesSearch = (
        item.location?.toLowerCase().includes(search) ||
        item.type?.toLowerCase().includes(search) ||
        item.reofferedBy?.toLowerCase().includes(search) ||
        notesText.includes(search)
      );
      if (!matchesSearch) return false;
    }

    // Location filter
    if (locationFilter && item.location !== locationFilter) return false;

    // Type filter
    if (typeFilter && item.type !== typeFilter) return false;

    // Floor filter
    if (floorFilter && item.floor !== floorFilter) return false;

    // Offered by filter
    if (offeredByFilter && item.reofferedBy !== offeredByFilter) return false;

    return true;
  });

  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-main ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Inventory" sidebarOpen={sidebarOpen} />
        
        <main className="dashboard-content">
          {/* Search Bar */}
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by location, type, offered by, or notes..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-primary" onClick={handleAddItem}>
              Add New Item
            </button>
          </div>

          {/* Inventory Table */}
          <div className="table-container">
            <div className="table-header">
              <div className="pagination-info">
                Showing {filteredInventory.length} of {inventory.length}
                {(locationFilter || typeFilter || floorFilter || offeredByFilter || searchTerm) && (
                  <button 
                    className="clear-filters-btn-small"
                    onClick={() => {
                      setLocationFilter('');
                      setTypeFilter('');
                      setFloorFilter('');
                      setOfferedByFilter('');
                      setSearchTerm('');
                    }}
                    title="Clear all filters"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <table className="inventory-table">
              <thead>
                <tr>
                  <th className="col-location filter-header" onClick={() => setShowLocationFilter(!showLocationFilter)}>
                    Location <span className="sort-icon">⇅</span>
                    {locationFilter && <span className="filter-indicator">●</span>}
                    {showLocationFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setLocationFilter('')}>
                          All Locations
                        </div>
                        {getUniqueLocations().map(location => (
                          <div 
                            key={location} 
                            className={`filter-option ${locationFilter === location ? 'active' : ''}`}
                            onClick={() => {
                              setLocationFilter(locationFilter === location ? '' : location);
                              setShowLocationFilter(false);
                            }}
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="col-type filter-header" onClick={() => setShowTypeFilter(!showTypeFilter)}>
                    Type <span className="sort-icon">⇅</span>
                    {typeFilter && <span className="filter-indicator">●</span>}
                    {showTypeFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setTypeFilter('')}>
                          All Types
                        </div>
                        {getUniqueTypes().map(type => (
                          <div 
                            key={type} 
                            className={`filter-option ${typeFilter === type ? 'active' : ''}`}
                            onClick={() => {
                              setTypeFilter(typeFilter === type ? '' : type);
                              setShowTypeFilter(false);
                            }}
                          >
                            {type}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="col-floor filter-header" onClick={() => setShowFloorFilter(!showFloorFilter)}>
                    Floor <span className="sort-icon">⇅</span>
                    {floorFilter && <span className="filter-indicator">●</span>}
                    {showFloorFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setFloorFilter('')}>
                          All Floors
                        </div>
                        {getUniqueFloors().map(floor => (
                          <div 
                            key={floor} 
                            className={`filter-option ${floorFilter === floor ? 'active' : ''}`}
                            onClick={() => {
                              setFloorFilter(floorFilter === floor ? '' : floor);
                              setShowFloorFilter(false);
                            }}
                          >
                            {floor}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="col-rent">Rent</th>
                  <th className="col-advance">Advance</th>
                  <th className="col-security">Security</th>
                  <th className="col-commission">Commission</th>
                  <th className="col-reoffered filter-header" onClick={() => setShowOfferedByFilter(!showOfferedByFilter)}>
                    Offered by <span className="sort-icon">⇅</span>
                    {offeredByFilter && <span className="filter-indicator">●</span>}
                    {showOfferedByFilter && (
                      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-option" onClick={() => setOfferedByFilter('')}>
                          All
                        </div>
                        {getUniqueOfferedBy().map(offeredBy => (
                          <div 
                            key={offeredBy} 
                            className={`filter-option ${offeredByFilter === offeredBy ? 'active' : ''}`}
                            onClick={() => {
                              setOfferedByFilter(offeredByFilter === offeredBy ? '' : offeredBy);
                              setShowOfferedByFilter(false);
                            }}
                          >
                            {offeredBy}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="col-notes">Notes</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-data">No inventory items found</td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item._id}>
                      <td className="col-location">{item.location || '-'}</td>
                      <td className="col-type">{item.type || '-'}</td>
                      <td className="col-floor">{item.floor || '-'}</td>
                      <td className="col-rent">{formatCurrency(item.rent)}</td>
                      <td className="col-advance">{formatCurrency(item.advance)}</td>
                      <td className="col-security">{formatCurrency(item.security)}</td>
                      <td className="col-commission">{formatCurrency(item.commission)}</td>
                      <td className="col-reoffered">{item.reofferedBy || '-'}</td>
                      <td 
                        className="col-notes"
                        onClick={() => {
                          setSelectedItemForNotes(item);
                          setIsNotesModalOpen(true);
                        }}
                        style={{ 
                          cursor: 'pointer',
                          color: '#2563eb'
                        }}
                        title="Click to view all notes"
                      >
                        {item.notes && Array.isArray(item.notes) && item.notes.length > 0
                          ? (() => {
                              // Get the latest note (most recent)
                              const sortedNotes = [...item.notes].sort((a, b) => {
                                const dateA = new Date(a.timestamp || a.createdAt || 0);
                                const dateB = new Date(b.timestamp || b.createdAt || 0);
                                return dateB - dateA;
                              });
                              const latestNote = sortedNotes[0];
                              const noteText = latestNote.text || '';
                              // Truncate if too long
                              return noteText.length > 50 
                                ? noteText.substring(0, 50) + '...' 
                                : noteText;
                            })()
                          : 'Click to add note'}
                      </td>
                      <td className="col-actions">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.36rem' }}>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditItem(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteItem(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Inventory Modal */}
      {isModalOpen && (
        <InventoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          item={editingItem}
          onSuccess={loadData}
        />
      )}

      {/* Notes Modal */}
      {isNotesModalOpen && (
        <NotesModal
          isOpen={isNotesModalOpen}
          onClose={(shouldRefresh) => {
            setIsNotesModalOpen(false);
            if (shouldRefresh) {
              loadData();
            }
            setSelectedItemForNotes(null);
          }}
          item={selectedItemForNotes}
        />
      )}
    </div>
  );
}

export default Inventory;

