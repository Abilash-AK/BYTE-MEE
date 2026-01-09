import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useOnboardingCheck } from '@/react-app/hooks/useOnboardingCheck';
import Sidebar from '@/react-app/components/Sidebar';
import { Sparkles, Users, Clock, Plus, Search, MapPin, Filter, X } from 'lucide-react';

interface Pod {
  id: number;
  name: string;
  description: string;
  creator_id: string;
  creator_name: string;
  skills_needed: string;
  team_size: number;
  duration: string;
  member_count: number;
  created_at: string;
  city?: string | null;
  district?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_name?: string | null;
  matchScore?: number;
}

interface UserLocation {
  city?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  tech_stack?: string | null;
}

export default function BrowsePods() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { checking, isPending } = useOnboardingCheck();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Auto-detect user's location for matchmaking
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
            {
              headers: {
                'User-Agent': 'ColearnApp/1.0',
              },
            }
          );
          
          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }
          
          const data = await response.json();
          const addr = data.address || {};
          
          // Update user location for matchmaking
          setUserLocation({
            city: addr.city || addr.town || addr.village || addr.locality || null,
            location_lat: latitude,
            location_lng: longitude,
            tech_stack: user?.tech_stack || null,
          });
          setLocationDetected(true);
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Still use coordinates even if reverse geocoding fails
          setUserLocation({
            city: null,
            location_lat: latitude,
            location_lng: longitude,
            tech_stack: user?.tech_stack || null,
          });
          setLocationDetected(true);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        // If geolocation fails, try to use tech_stack from API response
        setDetectingLocation(false);
        setLocationDetected(false);
      },
      geoOptions
    );
  }, [user]);

  const fetchPods = useCallback(async () => {
    try {
      const response = await fetch('/api/pods', { credentials: 'include' });
      const data = await response.json();
      setPods(data.pods || data); // Handle both new and old API response format
      
      // Use tech_stack from API if location detection hasn't happened yet
      if (data.userLocation && !locationDetected) {
        setUserLocation(prev => ({
          ...prev,
          tech_stack: data.userLocation.tech_stack || user?.tech_stack || null,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch pods:', error);
    } finally {
      setLoading(false);
    }
  }, [locationDetected, user]);

  useEffect(() => {
    if (user) {
      fetchPods();
      detectUserLocation();
    }
  }, [user, fetchPods, detectUserLocation]);


  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Calculate match score: 60% location, 40% tech stack
  const calculateMatchScore = useCallback((pod: Pod): number => {
    let locationScore = 0;
    let techScore = 0;

    // Location matching (60% weight)
    if (userLocation?.location_lat && userLocation?.location_lng && pod.location_lat && pod.location_lng) {
      const distance = calculateDistance(
        userLocation.location_lat,
        userLocation.location_lng,
        pod.location_lat,
        pod.location_lng
      );
      // Score based on distance: 0-10km = 100%, 10-50km = 80%, 50-100km = 60%, 100-200km = 40%, >200km = 20%
      if (distance <= 10) locationScore = 100;
      else if (distance <= 50) locationScore = 80;
      else if (distance <= 100) locationScore = 60;
      else if (distance <= 200) locationScore = 40;
      else locationScore = 20;
    } else if (userLocation?.city && pod.city) {
      // If coordinates not available, match by city name
      if (userLocation.city.toLowerCase() === pod.city.toLowerCase()) {
        locationScore = 100;
      } else {
        locationScore = 30; // Same state/district but different city
      }
    } else {
      locationScore = 0; // No location data
    }

    // Tech stack matching (40% weight)
    if (userLocation?.tech_stack && pod.skills_needed) {
      const userSkills = userLocation.tech_stack.split(',').map(s => s.trim().toLowerCase());
      const podSkills = pod.skills_needed.split(',').map(s => s.trim().toLowerCase());
      
      const matchingSkills = userSkills.filter(skill => 
        podSkills.some(podSkill => 
          podSkill.includes(skill) || skill.includes(podSkill)
        )
      );
      
      if (podSkills.length > 0) {
        techScore = (matchingSkills.length / podSkills.length) * 100;
      }
    } else {
      techScore = 50; // Neutral score if no tech stack data
    }

    // Weighted average: 60% location, 40% tech
    const matchScore = (locationScore * 0.6) + (techScore * 0.4);
    return Math.round(matchScore);
  }, [userLocation]);

  // Get unique cities and tech stacks for filters
  const uniqueCities = useMemo(() => {
    const cities = pods
      .map(pod => pod.city)
      .filter((city): city is string => Boolean(city))
      .filter((city, index, self) => self.indexOf(city) === index)
      .sort();
    return cities;
  }, [pods]);

  const uniqueTechStacks = useMemo(() => {
    const techs = new Set<string>();
    pods.forEach(pod => {
      if (pod.skills_needed) {
        pod.skills_needed.split(',').forEach(skill => {
          techs.add(skill.trim());
        });
      }
    });
    return Array.from(techs).sort();
  }, [pods]);

  // Filter and sort pods
  const filteredAndSortedPods = useMemo(() => {
    let filtered = [...pods];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pod =>
        pod.name.toLowerCase().includes(query) ||
        pod.description.toLowerCase().includes(query) ||
        pod.skills_needed.toLowerCase().includes(query) ||
        pod.creator_name.toLowerCase().includes(query)
      );
    }

    // Apply city filter
    if (selectedCity) {
      filtered = filtered.filter(pod => pod.city === selectedCity);
    }

    // Apply tech stack filter
    if (selectedTech) {
      filtered = filtered.filter(pod =>
        pod.skills_needed.toLowerCase().includes(selectedTech.toLowerCase())
      );
    }

    // Calculate match scores and sort
    const podsWithScores = filtered.map(pod => ({
      ...pod,
      matchScore: calculateMatchScore(pod),
    }));

    // Sort by match score (descending), then by created_at (newest first)
    return podsWithScores.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [pods, searchQuery, selectedCity, selectedTech, calculateMatchScore]);

  if (isPending || checking || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
        <div className="animate-spin">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-warmth/10 to-secondary/5">
      <Sidebar />

      <main className="md:ml-64 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Browse Pods</h1>
              <p className="text-gray-600">Find teams to join for hackathons and projects</p>
              {detectingLocation && (
                <p className="text-sm text-primary mt-1 flex items-center gap-1 animate-pulse">
                  <MapPin className="w-4 h-4" />
                  Detecting your location for personalized recommendations...
                </p>
              )}
              {locationDetected && userLocation?.location_lat && userLocation?.location_lng && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  {userLocation.city 
                    ? `Showing pods near ${userLocation.city} (sorted by distance & match)`
                    : 'Location detected - pods sorted by distance & match'}
                </p>
              )}
              {!detectingLocation && !locationDetected && (
                <p className="text-sm text-gray-400 mt-1">
                  Enable location access for personalized recommendations
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/pods/create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Pod
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pods by name, description, skills..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-5 h-5" />
                Filters
                {(selectedCity || selectedTech) && (
                  <span className="px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                    {(selectedCity ? 1 : 0) + (selectedTech ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Cities</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Tech Stack Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tech Stack
                  </label>
                  <select
                    value={selectedTech}
                    onChange={(e) => setSelectedTech(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Tech Stacks</option>
                    {uniqueTechStacks.map(tech => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {(selectedCity || selectedTech) && (
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedCity('');
                        setSelectedTech('');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
          ) : pods.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No pods available</h3>
              <p className="text-gray-600 mb-6">Be the first to create a pod for your project or hackathon</p>
              <button
                onClick={() => navigate('/pods/create')}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Pod
              </button>
            </div>
          ) : filteredAndSortedPods.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No pods found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('');
                  setSelectedTech('');
                }}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Clear All
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredAndSortedPods.map((pod) => {
                const skills = pod.skills_needed ? pod.skills_needed.split(',').map(s => s.trim()) : [];
                const isCreator = pod.creator_id === user.id;
                const isFull = pod.member_count >= pod.team_size;

                return (
                  <div
                    key={pod.id}
                    onClick={() => navigate(`/pods/${pod.id}`)}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border border-warmth/20 hover:border-warmth/40"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {isCreator && (
                          <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-2">
                            Created by you
                          </div>
                        )}
                        {isFull && (
                          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full mb-2 ml-2">
                            Full
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900 flex-1">{pod.name}</h3>
                      {pod.matchScore !== undefined && pod.matchScore > 0 && (
                        <div className="ml-2 flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                          <span>{pod.matchScore}%</span>
                          <span className="text-[10px]">match</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{pod.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">by {pod.creator_name}</p>
                      {pod.city && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{pod.city}{pod.district ? `, ${pod.district}` : ''}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                          +{skills.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{pod.member_count}/{pod.team_size}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{pod.duration}</span>
                        </div>
                      </div>
                      
                      {!isCreator && !isFull && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pods/${pod.id}`);
                          }}
                          className="px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
