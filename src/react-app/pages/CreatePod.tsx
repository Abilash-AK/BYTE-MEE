import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { Sparkles, ArrowLeft, MapPin, Search, Navigation } from 'lucide-react';

export default function CreatePod() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skills_needed: '',
    team_size: 4,
    duration: '1 week',
    deadline: '',
    location_name: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    city: '',
    district: '',
  });
  const [submitting, setSubmitting] = useState(false);
  interface LocationResult {
    display_name: string;
    lat: number;
    lon: number;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      locality?: string;
      neighbourhood?: string;
      suburb?: string;
      state?: string;
      county?: string;
      state_district?: string;
      country?: string;
      postcode?: string;
    };
    original_display?: string;
  }

  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Search for locations using Nominatim (OpenStreetMap) - free, no API key needed
  // Focused on India locations
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setLocationResults([]);
      return;
    }

    setSearchingLocation(true);
    try {
      // Add "India" to query to prioritize Indian locations, and use countrycodes parameter
      const searchQuery = query.includes('India') || query.includes('india') 
        ? query 
        : `${query}, India`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=10&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'ColearnApp/1.0', // Required by Nominatim
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const data = await response.json();
      
      // Filter to ensure results are in India and format them better
      interface NominatimResult {
        lat: string | number;
        lon: string | number;
        display_name: string;
        address?: {
          country?: string;
          country_code?: string;
          city?: string;
          town?: string;
          village?: string;
          locality?: string;
          neighbourhood?: string;
          suburb?: string;
          state?: string;
          county?: string;
          state_district?: string;
          postcode?: string;
        };
      }
      
      const filteredData: LocationResult[] = (data as NominatimResult[])
        .filter((item) => {
          const country = item.address?.country || item.address?.country_code?.toUpperCase();
          return country === 'India' || country === 'IN' || !country; // Include if India or unknown
        })
        .map((item) => ({
          display_name: formatIndianAddress(item),
          lat: typeof item.lat === 'number' ? item.lat : parseFloat(String(item.lat)),
          lon: typeof item.lon === 'number' ? item.lon : parseFloat(String(item.lon)),
          address: item.address,
          original_display: item.display_name,
        }));
      
      setLocationResults(filteredData);
    } catch (error) {
      console.error('Location search failed:', error);
      alert('Failed to search location. Please try again.');
    } finally {
      setSearchingLocation(false);
    }
  };

  // Format Indian address for better display
  interface AddressItem {
    address?: {
      locality?: string;
      neighbourhood?: string;
      suburb?: string;
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state_district?: string;
      state?: string;
      postcode?: string;
    };
    display_name?: string;
    lat?: string | number;
    lon?: string | number;
  }
  
  const formatIndianAddress = (item: AddressItem): string => {
    const addr = item.address || {};
    const parts = [];
    
    // Add locality/neighborhood
    if (addr.locality || addr.neighbourhood || addr.suburb) {
      parts.push(addr.locality || addr.neighbourhood || addr.suburb);
    }
    
    // Add city/town
    if (addr.city || addr.town || addr.village) {
      parts.push(addr.city || addr.town || addr.village);
    }
    
    // Add district
    if (addr.county || addr.state_district) {
      parts.push(addr.county || addr.state_district);
    }
    
    // Add state
    if (addr.state) {
      parts.push(addr.state);
    }
    
    // Add postal code if available
    if (addr.postcode) {
      parts.push(addr.postcode);
    }
    
    // If we have parts, join them; otherwise use original display_name
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    return item.display_name || `${item.lat}, ${item.lon}`;
  };

  // Auto-detect user's location with better error handling
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please search for a location manually.');
      return;
    }

    setDetectingLocation(true);
    
    // Use better geolocation options
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 0, // Don't use cached position
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Check if accuracy is reasonable (within 1000m)
        if (accuracy > 1000) {
          console.warn('Location accuracy is low:', accuracy, 'meters');
        }
        
        try {
          // Reverse geocode to get address with detailed information
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
            {
              headers: {
                'User-Agent': 'ColearnApp/1.0',
              },
            }
          );
          
          if (!response.ok) {
            throw new Error('Reverse geocoding request failed');
          }
          
          const data = await response.json();
          
          // Format the address for Indian locations
          const formattedAddress = formatIndianAddress(data);
          const addr = data.address || {};
          
          setFormData({
            ...formData,
            location_name: formattedAddress,
            location_lat: latitude,
            location_lng: longitude,
            city: addr.city || addr.town || addr.village || addr.locality || '',
            district: addr.state || addr.county || addr.state_district || '',
          });
          setLocationSearch(formattedAddress);
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Still set coordinates even if reverse geocoding fails
          const coordString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setFormData({
            ...formData,
            location_lat: latitude,
            location_lng: longitude,
            location_name: coordString,
          });
          setLocationSearch(coordString);
          alert('Location detected but address lookup failed. Coordinates saved. You can search for a nearby location.');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to detect location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location permissions in your browser settings and try again, or search manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please search for a location manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or search manually.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please search for a location manually.';
            break;
        }
        
        alert(errorMessage);
        setDetectingLocation(false);
      },
      geoOptions
    );
  };

  // Select a location from search results
  const selectLocation = (result: LocationResult) => {
    const addr = result.address || {};
    setFormData({
      ...formData,
      location_name: result.display_name,
      location_lat: result.lat,
      location_lng: result.lon,
      city: addr.city || addr.town || addr.village || addr.locality || '',
      district: addr.state || addr.county || addr.state_district || '',
    });
    setLocationSearch(result.display_name);
    setLocationResults([]);
  };

  // Clear location
  const clearLocation = () => {
    setFormData({
      ...formData,
      location_name: '',
      location_lat: null,
      location_lng: null,
      city: '',
      district: '',
    });
    setLocationSearch('');
    setLocationResults([]);
  };

  useEffect(() => {
    // Debounce location search
    const timeoutId = setTimeout(() => {
      if (locationSearch) {
        searchLocation(locationSearch);
      } else {
        setLocationResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/pods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const pod = await response.json();
        navigate(`/pods/${pod.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create pod');
      }
    } catch (error) {
      console.error('Failed to create pod:', error);
      alert('Failed to create pod');
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending || checking || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
        <div className="animate-spin">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
      </div>
    );
  }

  const skillOptions = [
    'React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++',
    'HTML/CSS', 'Node.js', 'SQL', 'MongoDB', 'AI/ML', 'Design',
    'DevOps', 'Mobile', 'Backend', 'Frontend', 'Full Stack'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
      <Sidebar />

      <main className="md:ml-64 p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Pod</h1>
            <p className="text-gray-600 mb-8">Start a team for your hackathon or project</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Pod Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Climate Hack Team, AI Chatbot Project"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's your project about? What will the team work on?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Skills Needed *
                </label>
                <p className="text-sm text-gray-500 mb-3">Select skills you're looking for in team members</p>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => {
                    const selectedSkills = formData.skills_needed.split(',').map(s => s.trim()).filter(Boolean);
                    const isSelected = selectedSkills.includes(skill);

                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            const newSkills = selectedSkills.filter(s => s !== skill);
                            setFormData({ ...formData, skills_needed: newSkills.join(', ') });
                          } else {
                            const newSkills = [...selectedSkills, skill];
                            setFormData({ ...formData, skills_needed: newSkills.join(', ') });
                          }
                        }}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="team_size" className="block text-sm font-semibold text-gray-900 mb-2">
                  Team Size: {formData.team_size} people
                </label>
                <input
                  type="range"
                  id="team_size"
                  min="2"
                  max="10"
                  value={formData.team_size}
                  onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-semibold text-gray-900 mb-2">
                  Duration *
                </label>
                <select
                  id="duration"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="24 hours">24 hours</option>
                  <option value="48 hours">48 hours</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="Ongoing">Ongoing</option>
                </select>
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-semibold text-gray-900 mb-2">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">When should this pod be completed?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Location *
                </label>
                <p className="text-sm text-gray-500 mb-3">Where will this pod take place?</p>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="Search for a location in India (e.g., Mumbai, Bangalore, Delhi)..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detectingLocation}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Auto-detect my location"
                    >
                      <Navigation className="w-5 h-5" />
                      {detectingLocation ? 'Detecting...' : 'Auto'}
                    </button>
                  </div>

                  {locationResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                      {locationResults.map((result, idx) => {
                        const addr = result.address || {};
                        const cityInfo = addr.city || addr.town || addr.village || addr.locality || '';
                        const stateInfo = addr.state || addr.county || addr.state_district || '';
                        const countryInfo = addr.country || '';
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectLocation(result)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3 transition-colors"
                          >
                            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{result.display_name}</p>
                              {(cityInfo || stateInfo) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {[cityInfo, stateInfo, countryInfo].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {formData.location_name && (
                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-start gap-2 flex-1">
                        <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{formData.location_name}</p>
                          {(formData.city || formData.district) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {[formData.city, formData.district].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {formData.location_lat && formData.location_lng && (
                            <p className="text-xs text-gray-400 mt-1">
                              Coordinates: {formData.location_lat.toFixed(6)}, {formData.location_lng.toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearLocation}
                        className="text-gray-400 hover:text-gray-600 ml-2 text-xl font-bold leading-none"
                        title="Clear location"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {searchingLocation && (
                    <p className="text-sm text-gray-500">Searching locations...</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? 'Creating...' : 'Create Pod'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
