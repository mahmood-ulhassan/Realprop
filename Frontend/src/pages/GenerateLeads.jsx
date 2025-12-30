import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import googlePlacesService from '../services/googlePlacesService';
import campaignsService from '../services/campaignsService';
import { userService } from '../services/userService';
import './GenerateLeads.css';
import './Dashboard.css';

// Pakistani cities and their major areas
const pakistaniCities = {
  'Islamabad': [
    'F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10', 'G-11',
    'I-8', 'I-9', 'I-10', 'I-11', 'DHA Phase 1', 'DHA Phase 2', 'Bahria Town', 'Sector E-7',
    'Sector F-5', 'Sector G-5', 'Sector H-8', 'Sector H-9', 'Sector I-8 Markaz', 'Blue Area',
    'Aabpara', 'Awan Town', 'Shahzad Town', 'PWD', 'Soan Garden', 'Rawal Town'
  ],
  'Karachi': [
    'Clifton', 'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'DHA Phase 4', 'DHA Phase 5',
    'DHA Phase 6', 'DHA Phase 7', 'DHA Phase 8', 'Gulshan-e-Iqbal', 'Gulistan-e-Johar',
    'PECHS', 'Bahadurabad', 'Shahrah-e-Faisal', 'Saddar', 'Tariq Road', 'Zamzama',
    'Defence', 'Korangi', 'Malir', 'Landhi', 'Shah Faisal', 'Gulshan', 'North Nazimabad',
    'Nazimabad', 'Liaquatabad', 'Federal B Area', 'Garden East', 'Garden West', 'Kemari',
    'Lyari', 'Orangi', 'SITE', 'Industrial Area', 'Karachi Airport', 'Port Qasim'
  ],
  'Lahore': [
    'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'DHA Phase 4', 'DHA Phase 5', 'DHA Phase 6',
    'Gulberg', 'Model Town', 'Johar Town', 'Faisal Town', 'Wapda Town', 'Valencia',
    'Bahria Town', 'Askari', 'Cantt', 'Mall Road', 'The Mall', 'MM Alam Road',
    'Liberty Market', 'Anarkali', 'Ichhra', 'Samnabad', 'Shadman', 'Garden Town',
    'Punjab Society', 'Muslim Town', 'Allama Iqbal Town', 'Township', 'Samanabad',
    'Ravi Road', 'Wagah', 'Thokar Niaz Baig', 'Multan Road', 'Ferozepur Road'
  ],
  'Rawalpindi': [
    'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'Bahria Town', 'Askari', 'Chaklala',
    'Satellite Town', 'Gulistan Colony', 'Raja Bazaar', 'Moti Bazaar', 'Banni',
    'Westridge', 'Lalazar', 'Adiala Road', 'Sadiqabad', 'Tench Bhatta', 'Gulraiz',
    'Peshawar Road', 'GT Road', 'Murree Road', '6th Road', '7th Road', '8th Road'
  ],
  'Faisalabad': [
    'DHA', 'Satellite Town', 'Madina Town', 'Jinnah Colony', 'People\'s Colony',
    'Gulberg', 'Lyallpur Town', 'Samanabad', 'Jaranwala Road', 'Sargodha Road',
    'Jhang Road', 'Chiniot Road', 'Gatwala', 'Dijkot Road', 'Jail Road'
  ],
  'Multan': [
    'DHA', 'Bosan Road', 'Shah Rukn-e-Alam', 'Cantt', 'Gulgasht', 'Shah Shams',
    'Shamsabad', 'Basti Malook', 'Lodhran Road', 'Vehari Road', 'Khanewal Road',
    'Bahawalpur Road', 'MDA', 'Model Town', 'Shah Rukn-e-Alam Colony'
  ],
  'Peshawar': [
    'Hayatabad Phase 1', 'Hayatabad Phase 2', 'Hayatabad Phase 3', 'Hayatabad Phase 4',
    'Hayatabad Phase 5', 'Hayatabad Phase 6', 'Hayatabad Phase 7', 'University Town',
    'Cantt', 'Gulbahar', 'Warsak Road', 'Kohat Road', 'Ring Road', 'Jamrud Road'
  ],
  'Quetta': [
    'Cantt', 'Jinnah Town', 'Sariab Road', 'Brewery Road', 'Airport Road',
    'Samungli Road', 'Hanna Urak', 'Kuchlak Road', 'Spinny Road'
  ],
  'Sialkot': [
    'DHA', 'Cantt', 'Model Town', 'Satellite Town', 'Gulshan Colony',
    'Allama Iqbal Road', 'Jinnah Road', 'Kashmir Road', 'Lahore Road'
  ],
  'Gujranwala': [
    'DHA', 'Model Town', 'Satellite Town', 'Cantt', 'GT Road', 'Sialkot Road',
    'Lahore Road', 'Wapda Town', 'People\'s Colony'
  ],
  'Sargodha': [
    'Cantt', 'Satellite Town', 'Model Town', 'Jinnah Colony', 'Faisalabad Road',
    'Lahore Road', 'Sahiwal Road'
  ],
  'Bahawalpur': [
    'Model Town', 'Cantt', 'DHA', 'Satellite Town', 'Bahawalnagar Road',
    'Multan Road', 'Lodhran Road'
  ],
  'Sukkur': [
    'Cantt', 'Old Sukkur', 'New Sukkur', 'Rohri', 'Airport Road', 'Shikarpur Road'
  ],
  'Larkana': [
    'Cantt', 'Model Town', 'Shahbaz Town', 'Airport Road', 'Ratodero Road'
  ],
  'Hyderabad': [
    'Latifabad', 'Qasimabad', 'Hirabad', 'PIB Colony', 'Gulistan-e-Sajjad',
    'Sindh University Road', 'Autobahn Road'
  ],
  'Gujrat': [
    'Cantt', 'Model Town', 'Satellite Town', 'GT Road', 'Sialkot Road'
  ],
  'Kasur': [
    'Cantt', 'Model Town', 'Lahore Road', 'Kot Radha Kishan Road'
  ],
  'Sheikhupura': [
    'Cantt', 'Model Town', 'Lahore Road', 'Faisalabad Road'
  ],
  'Rahim Yar Khan': [
    'Model Town', 'Cantt', 'Bahawalpur Road', 'Khanpur Road'
  ],
  'Jhang': [
    'Cantt', 'Model Town', 'Faisalabad Road', 'Sargodha Road'
  ]
};

function GenerateLeads() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('Pakistan');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [availableAreas, setAvailableAreas] = useState([]);
  const [useGooglePlaces, setUseGooglePlaces] = useState(false);
  const [generatedPlaces, setGeneratedPlaces] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [managers, setManagers] = useState([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const autocompleteInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
      
      // Load managers if user is admin
      if (currentUser.role === 'admin') {
        loadManagers();
      }
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

  // Load Google Places Autocomplete script
  useEffect(() => {
    if (selectedCity && useGooglePlaces) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      document.head.appendChild(script);

      return () => {
        // Cleanup
        if (autocompleteRef.current) {
          window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        }
      };
    }
  }, [selectedCity, useGooglePlaces]);

  const initializeAutocomplete = () => {
    if (autocompleteInputRef.current && window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          types: ['(regions)'],
          componentRestrictions: { country: 'pk' }, // Restrict to Pakistan
          fields: ['address_components', 'formatted_address']
        }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.address_components) {
          // Extract area/locality from place
          const area = place.address_components.find(
            component => component.types.includes('locality') || component.types.includes('sublocality')
          );
          if (area) {
            setSelectedArea(area.long_name);
          } else {
            setSelectedArea(place.formatted_address);
          }
        }
      });
    }
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setSelectedArea(''); // Reset area when city changes
    
    // Update available areas based on city
    if (city && pakistaniCities[city]) {
      setAvailableAreas(pakistaniCities[city]);
    } else {
      setAvailableAreas([]);
    }
  };

  const handleAreaChange = (e) => {
    setSelectedArea(e.target.value);
  };

  const handleGenerateLeads = async () => {
    if (!selectedCity || !selectedArea || !selectedIndustry.trim()) {
      setGenerationError('Please fill in all fields (City, Area, and Industry)');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');
    setGeneratedPlaces([]);
    setSelectedLeads(new Set()); // Clear selections

    try {
      const places = await googlePlacesService.searchPlaces(
        selectedCity,
        selectedArea,
        selectedIndustry.trim()
      );
      setGeneratedPlaces(places);
    } catch (err) {
      console.error('Error generating leads:', err);
      setGenerationError(err.message || 'Failed to generate leads. Please check your Google Places API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectLead = (index) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === generatedPlaces.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(generatedPlaces.map((_, index) => index)));
    }
  };

  const handleCreateCampaign = () => {
    if (selectedLeads.size === 0) {
      setGenerationError('Please select at least one lead to create a campaign');
      return;
    }
    setShowCampaignModal(true);
    setCampaignName('');
    setSelectedManager('');
    setGenerationError('');
  };

  const handleCloseCampaignModal = () => {
    setShowCampaignModal(false);
    setCampaignName('');
    setSelectedManager('');
  };

  const handleSubmitCampaign = async () => {
    if (!campaignName.trim()) {
      setGenerationError('Campaign name is required');
      return;
    }

    if (!selectedManager) {
      setGenerationError('Please select a manager to assign the campaign');
      return;
    }

    setIsCreatingCampaign(true);
    setGenerationError('');

    try {
      const selectedLeadsData = Array.from(selectedLeads).map(index => {
        const place = generatedPlaces[index];
        return {
          name: place.name || 'N/A',
          phone: place.phone || 'N/A',
          email: place.email || 'N/A',
          website: place.website || 'N/A',
          instagram: place.instagram || 'N/A',
          facebook: place.facebook || 'N/A',
          address: place.address || 'N/A'
        };
      });

      await campaignsService.createCampaign({
        name: campaignName.trim(),
        assignedTo: selectedManager,
        leads: selectedLeadsData
      });

      setSuccessMessage(`Campaign "${campaignName.trim()}" created successfully with ${selectedLeadsData.length} leads!`);
      setShowCampaignModal(false);
      setSelectedLeads(new Set());
      setCampaignName('');
      setSelectedManager('');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error creating campaign:', err);
      setGenerationError(err.response?.data?.message || err.message || 'Failed to create campaign');
    } finally {
      setIsCreatingCampaign(false);
    }
  };


  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  const cities = Object.keys(pakistaniCities).sort();

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-main ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Generate Leads" sidebarOpen={sidebarOpen} />
        
        <main className="dashboard-content">
          <div className="generate-leads-container">
            <h2 className="generate-leads-title">Enter Requirement</h2>
            
            <div className="generate-leads-form-row">
              {/* Country */}
              <div className="form-group-inline">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  value={selectedCountry}
                  disabled
                  className="form-select-inline"
                >
                  <option value="Pakistan">Pakistan</option>
                </select>
              </div>

              {/* City */}
              <div className="form-group-inline">
                <label htmlFor="city">City</label>
                <select
                  id="city"
                  value={selectedCity}
                  onChange={handleCityChange}
                  className="form-select-inline"
                >
                  <option value="">Select a city</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Area */}
              <div className="form-group-inline">
                <label htmlFor="area">Area</label>
                {selectedCity ? (
                  useGooglePlaces ? (
                    <input
                      ref={autocompleteInputRef}
                      type="text"
                      id="area"
                      placeholder={`Search area in ${selectedCity}...`}
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="form-input-inline autocomplete-input"
                    />
                  ) : (
                    <select
                      id="area"
                      value={selectedArea}
                      onChange={handleAreaChange}
                      className="form-select-inline"
                    >
                      <option value="">Select an area</option>
                      {availableAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  )
                ) : (
                  <input
                    type="text"
                    id="area"
                    placeholder="Select city first"
                    disabled
                    className="form-input-inline"
                  />
                )}
              </div>

              {/* Industry */}
              <div className="form-group-inline form-group-industry">
                <label htmlFor="industry">Industry</label>
                <input
                  type="text"
                  id="industry"
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  placeholder="e.g., Restaurants, Shops, Offices"
                  className="form-input-inline"
                />
              </div>

              {/* Generate Button */}
              <div className="form-group-button">
                <button
                  type="button"
                  className="btn-generate"
                  onClick={handleGenerateLeads}
                  disabled={!selectedCity || !selectedArea || !selectedIndustry.trim() || isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>

            {/* Google Places Toggle (hidden by default, can be shown if needed) */}
            {selectedCity && (
              <div className="area-toggle-container">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={useGooglePlaces}
                    onChange={(e) => setUseGooglePlaces(e.target.checked)}
                  />
                  <span>Use Google Places Autocomplete for Area</span>
                </label>
              </div>
            )}

            {/* Error Message */}
            {generationError && (
              <div className="generation-error">
                {generationError}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="generation-success" style={{ 
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

            {/* Loading State */}
            {isGenerating && (
              <div className="generation-loading">
                <div className="loading-spinner"></div>
                <p>Generating leads...</p>
              </div>
            )}

            {/* Results Table */}
            {generatedPlaces.length > 0 && !isGenerating && (
              <div className="generated-results-container">
                <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="pagination-info">
                    Showing {generatedPlaces.length} result{generatedPlaces.length !== 1 ? 's' : ''}
                    {selectedLeads.size > 0 && (
                      <span style={{ marginLeft: '1rem', color: '#3b82f6' }}>
                        ({selectedLeads.size} selected)
                      </span>
                    )}
                  </div>
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      className="btn-generate"
                      onClick={handleCreateCampaign}
                      disabled={selectedLeads.size === 0}
                      style={{ minWidth: '150px', backgroundColor: selectedLeads.size === 0 ? '#ccc' : '#3b82f6' }}
                    >
                      Create Campaign
                    </button>
                  )}
                </div>
                <div className="table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        {user?.role === 'admin' && (
                          <th style={{ width: '50px' }}>
                            <input
                              type="checkbox"
                              checked={selectedLeads.size === generatedPlaces.length && generatedPlaces.length > 0}
                              onChange={handleSelectAll}
                            />
                          </th>
                        )}
                        <th className="col-name">Name</th>
                        <th className="col-phone">Phone</th>
                        <th className="col-email">Email</th>
                        <th className="col-website">Website</th>
                        <th className="col-instagram">Instagram</th>
                        <th className="col-facebook">Facebook</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedPlaces.map((place, index) => (
                        <tr key={place.placeId || index}>
                          {user?.role === 'admin' && (
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(index)}
                                onChange={() => handleSelectLead(index)}
                              />
                            </td>
                          )}
                          <td className="col-name">{place.name || 'N/A'}</td>
                          <td className="col-phone">
                            {place.phone && place.phone !== 'N/A' ? (
                              <a href={`tel:${place.phone}`}>{place.phone}</a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="col-email">
                            {place.email && place.email !== 'N/A' ? (
                              <a href={`mailto:${place.email}`} target="_blank" rel="noopener noreferrer">
                                {place.email}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="col-website">
                            {place.website && place.website !== 'N/A' ? (
                              <a href={place.website} target="_blank" rel="noopener noreferrer">
                                {place.website}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="col-instagram">
                            {place.instagram && place.instagram !== 'N/A' ? (
                              <a href={place.instagram} target="_blank" rel="noopener noreferrer">
                                {place.instagram}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="col-facebook">
                            {place.facebook && place.facebook !== 'N/A' ? (
                              <a href={place.facebook} target="_blank" rel="noopener noreferrer">
                                {place.facebook}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Campaign Creation Modal */}
            {showCampaignModal && (
              <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }} onClick={handleCloseCampaignModal}>
                <div className="modal-content" style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '8px',
                  maxWidth: '500px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflow: 'auto'
                }} onClick={(e) => e.stopPropagation()}>
                  <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Create Campaign</h2>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Assign To Manager *
                    </label>
                    <select
                      value={selectedManager}
                      onChange={(e) => setSelectedManager(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Select a manager</option>
                      {managers.map(manager => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name} ({manager.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <strong>Selected Leads: {selectedLeads.size}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleCloseCampaignModal}
                      disabled={isCreatingCampaign}
                      style={{
                        padding: '0.5rem 1.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: isCreatingCampaign ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitCampaign}
                      disabled={isCreatingCampaign || !campaignName.trim() || !selectedManager}
                      style={{
                        padding: '0.5rem 1.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: isCreatingCampaign || !campaignName.trim() || !selectedManager ? '#ccc' : '#3b82f6',
                        color: 'white',
                        cursor: isCreatingCampaign || !campaignName.trim() || !selectedManager ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default GenerateLeads;
