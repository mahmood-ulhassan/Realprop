import { useState, useEffect } from 'react';
import './UserModal.css';
import inventoryService from '../services/inventoryService';

function InventoryModal({ isOpen, onClose, item = null, onSuccess }) {
  const [formData, setFormData] = useState({
    location: '',
    type: '',
    floor: '',
    rent: '',
    advance: '',
    security: '',
    commission: '',
    reofferedBy: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [floorOptions, setFloorOptions] = useState([]);
  const [reofferedOptions, setReofferedOptions] = useState([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddReoffered, setShowAddReoffered] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [newReoffered, setNewReoffered] = useState('');

  // Load options from localStorage on mount
  useEffect(() => {
    const savedLocations = localStorage.getItem('inventoryLocationOptions');
    const savedTypes = localStorage.getItem('inventoryTypeOptions');
    const savedFloors = localStorage.getItem('inventoryFloorOptions');
    const savedReoffered = localStorage.getItem('inventoryReofferedOptions');
    
    if (savedLocations) {
      setLocationOptions(JSON.parse(savedLocations));
    }
    if (savedTypes) {
      setTypeOptions(JSON.parse(savedTypes));
    }
    if (savedFloors) {
      setFloorOptions(JSON.parse(savedFloors));
    }
    if (savedReoffered) {
      setReofferedOptions(JSON.parse(savedReoffered));
    }
  }, []);

  useEffect(() => {
    if (item) {
      // Edit mode - populate form with item data
      setFormData({
        location: item.location || '',
        type: item.type || '',
        floor: item.floor || '',
        rent: item.rent || '',
        advance: item.advance || '',
        security: item.security || '',
        commission: item.commission || '',
        reofferedBy: item.reofferedBy || '',
        notes: item.notes ? (Array.isArray(item.notes) ? item.notes.map(n => n.text || n).join('\n') : item.notes) : ''
      });
    } else {
      // Add mode - reset form
      setFormData({
        location: '',
        type: '',
        floor: '',
        rent: '',
        advance: '',
        security: '',
        commission: '',
        reofferedBy: '',
        notes: ''
      });
    }
    setError('');
  }, [item, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      const updated = [...locationOptions, newLocation.trim()];
      setLocationOptions(updated);
      localStorage.setItem('inventoryLocationOptions', JSON.stringify(updated));
      setFormData(prev => ({ ...prev, location: newLocation.trim() }));
      setNewLocation('');
      setShowAddLocation(false);
    }
  };

  const handleAddType = () => {
    if (newType.trim()) {
      const updated = [...typeOptions, newType.trim()];
      setTypeOptions(updated);
      localStorage.setItem('inventoryTypeOptions', JSON.stringify(updated));
      setFormData(prev => ({ ...prev, type: newType.trim() }));
      setNewType('');
      setShowAddType(false);
    }
  };

  const handleAddFloor = () => {
    if (newFloor.trim()) {
      const updated = [...floorOptions, newFloor.trim()];
      setFloorOptions(updated);
      localStorage.setItem('inventoryFloorOptions', JSON.stringify(updated));
      setFormData(prev => ({ ...prev, floor: newFloor.trim() }));
      setNewFloor('');
      setShowAddFloor(false);
    }
  };

  const handleRemoveFloor = (floorToRemove) => {
    const updated = floorOptions.filter(f => f !== floorToRemove);
    setFloorOptions(updated);
    localStorage.setItem('inventoryFloorOptions', JSON.stringify(updated));
    if (formData.floor === floorToRemove) {
      setFormData(prev => ({ ...prev, floor: '' }));
    }
  };

  const handleAddReoffered = () => {
    if (newReoffered.trim()) {
      const updated = [...reofferedOptions, newReoffered.trim()];
      setReofferedOptions(updated);
      localStorage.setItem('inventoryReofferedOptions', JSON.stringify(updated));
      setFormData(prev => ({ ...prev, reofferedBy: newReoffered.trim() }));
      setNewReoffered('');
      setShowAddReoffered(false);
    }
  };

  const numberToWords = (amount) => {
    if (!amount && amount !== 0) return '';
    const num = parseFloat(amount);
    if (isNaN(num)) return '';
    
    const numStr = Math.floor(num).toString();
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];
    
    if (num === 0) return 'Zero';
    if (num < 0) return 'Negative ' + numberToWords(Math.abs(num));
    
    const convertHundreds = (n) => {
      if (n === 0) return '';
      let result = '';
      
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result.trim();
      }
      
      if (n > 0) {
        result += ones[n] + ' ';
      }
      
      return result.trim();
    };
    
    if (num < 1000) {
      return convertHundreds(num);
    }
    
    let result = '';
    let scaleIndex = 0;
    let remaining = num;
    
    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk !== 0) {
        const chunkWords = convertHundreds(chunk);
        if (chunkWords) {
          result = chunkWords + (scales[scaleIndex] ? ' ' + scales[scaleIndex] + ' ' : '') + result;
        }
      }
      remaining = Math.floor(remaining / 1000);
      scaleIndex++;
    }
    
    return result.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        location: formData.location.trim(),
        type: formData.type.trim() || undefined,
        floor: formData.floor.trim() || undefined,
        rent: formData.rent ? parseFloat(formData.rent) : undefined,
        advance: formData.advance ? parseFloat(formData.advance) : undefined,
        security: formData.security ? parseFloat(formData.security) : undefined,
        commission: formData.commission ? parseFloat(formData.commission) : undefined,
        reofferedBy: formData.reofferedBy.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      if (item) {
        await inventoryService.update(item._id, submitData);
      } else {
        await inventoryService.create(submitData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving inventory item:', err);
      setError(err.response?.data?.message || 'Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group-with-button">
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              {showAddLocation ? (
                <div className="add-option-input">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Enter new location"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLocation();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="confirm-add-button"
                    onClick={handleAddLocation}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="cancel-add-button"
                    onClick={() => {
                      setShowAddLocation(false);
                      setNewLocation('');
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select location</option>
                  {locationOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {!showAddLocation && (
              <button
                type="button"
                className="add-button"
                onClick={() => setShowAddLocation(true)}
              >
                + Add
              </button>
            )}
          </div>

          <div className="form-group-with-button">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              {showAddType ? (
                <div className="add-option-input">
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="Enter new type"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddType();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="confirm-add-button"
                    onClick={handleAddType}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="cancel-add-button"
                    onClick={() => {
                      setShowAddType(false);
                      setNewType('');
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select type</option>
                  {typeOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {!showAddType && (
              <button
                type="button"
                className="add-button"
                onClick={() => setShowAddType(true)}
              >
                + Add
              </button>
            )}
          </div>

          <div className="form-group-with-button">
            <div className="form-group">
              <label htmlFor="floor">Floor</label>
              {showAddFloor ? (
                <div className="add-option-input">
                  <input
                    type="text"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    placeholder="Enter new floor"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFloor();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="confirm-add-button"
                    onClick={handleAddFloor}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="cancel-add-button"
                    onClick={() => {
                      setShowAddFloor(false);
                      setNewFloor('');
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <select
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select floor</option>
                    {floorOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {formData.floor && floorOptions.includes(formData.floor) && (
                    <button
                      type="button"
                      className="cancel-add-button"
                      onClick={() => handleRemoveFloor(formData.floor)}
                      style={{ width: '32px', height: '32px', flexShrink: 0 }}
                      title="Remove this floor option"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
            {!showAddFloor && (
              <button
                type="button"
                className="add-button"
                onClick={() => setShowAddFloor(true)}
              >
                + Add
              </button>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rent">Rent</label>
              <input
                type="number"
                id="rent"
                name="rent"
                value={formData.rent}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={loading}
              />
              {formData.rent && (
                <div style={{ fontSize: '0.73125rem', color: '#6b7280', marginTop: '0.225rem' }}>
                  {numberToWords(formData.rent)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="advance">Advance</label>
              <input
                type="number"
                id="advance"
                name="advance"
                value={formData.advance}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={loading}
              />
              {formData.advance && (
                <div style={{ fontSize: '0.73125rem', color: '#6b7280', marginTop: '0.225rem' }}>
                  {numberToWords(formData.advance)}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="security">Security</label>
              <input
                type="number"
                id="security"
                name="security"
                value={formData.security}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={loading}
              />
              {formData.security && (
                <div style={{ fontSize: '0.73125rem', color: '#6b7280', marginTop: '0.225rem' }}>
                  {numberToWords(formData.security)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="commission">Commission</label>
              <input
                type="number"
                id="commission"
                name="commission"
                value={formData.commission}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={loading}
              />
              {formData.commission && (
                <div style={{ fontSize: '0.73125rem', color: '#6b7280', marginTop: '0.225rem' }}>
                  {numberToWords(formData.commission)}
                </div>
              )}
            </div>
          </div>

          <div className="form-group-with-button">
            <div className="form-group">
              <label htmlFor="reofferedBy">Offered by</label>
              {showAddReoffered ? (
                <div className="add-option-input">
                  <input
                    type="text"
                    value={newReoffered}
                    onChange={(e) => setNewReoffered(e.target.value)}
                    placeholder="Enter new offered by name"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddReoffered();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="confirm-add-button"
                    onClick={handleAddReoffered}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="cancel-add-button"
                    onClick={() => {
                      setShowAddReoffered(false);
                      setNewReoffered('');
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <select
                  id="reofferedBy"
                  name="reofferedBy"
                  value={formData.reofferedBy}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select offered by</option>
                  {reofferedOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {!showAddReoffered && (
              <button
                type="button"
                className="add-button"
                onClick={() => setShowAddReoffered(true)}
              >
                + Add
              </button>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Initial Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter initial notes (optional). You can add more notes via the timeline after saving."
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
              {loading ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryModal;

