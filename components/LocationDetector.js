'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Check } from 'lucide-react';
import { STATES, getStateFromCity, getNeighborhoods } from '@/lib/location-service';

export default function LocationDetector() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userSelected, setUserSelected] = useState(false);

   // Default to Las Vegas
  const DEFAULT_LOCATION = {
    city: 'Las Vegas',
    state: 'NV',
    area: 'The Strip',
    lat: 36.1699,
    lng: -115.1398,
    isInVegas: true
  };

  // Vegas coordinates
  const VEGAS_COORDS = {
    lat: 36.1699,
    lng: -115.1398,
    name: 'Las Vegas, NV'
  };

  // Vegas neighborhoods with approximate centers
  const VEGAS_NEIGHBORHOODS = [
    { name: 'The Strip', lat: 36.1147, lng: -115.1728 },
    { name: 'Downtown/Fremont', lat: 36.1699, lng: -115.1398 },
    { name: 'Summerlin', lat: 36.1797, lng: -115.3039 },
    { name: 'Henderson', lat: 36.0395, lng: -114.9817 },
    { name: 'North Las Vegas', lat: 36.1989, lng: -115.1175 },
    { name: 'Spring Valley', lat: 36.1081, lng: -115.2450 },
    { name: 'Enterprise', lat: 36.0251, lng: -115.2419 },
    { name: 'Paradise', lat: 36.0972, lng: -115.1467 },
    { name: 'Centennial Hills', lat: 36.3058, lng: -115.2439 },
    { name: 'Southwest', lat: 36.0500, lng: -115.2000 },
    { name: 'All Areas', lat: 36.1699, lng: -115.1398 }
  ];

  // Load saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('hybridhunting-location');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocation(parsed);
        setUserSelected(!!parsed.manuallySelected);
      } catch (e) {
        console.error('Failed to parse saved location:', e);
      }
    }
  }, []);

  // Distance calculator (miles)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Detect closest neighborhood
  const detectClosestNeighborhood = (lat, lng) => {
    let closest = 'The Strip';
    let closestDistance = Infinity;

    VEGAS_NEIGHBORHOODS.forEach(neighborhood => {
      if (neighborhood.name !== 'All Areas') {
        const distance = calculateDistance(lat, lng, neighborhood.lat, neighborhood.lng);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = neighborhood.name;
        }
      }
    });

    return { name: closest, distance: closestDistance };
  };

  const detectLocation = () => {
    setLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const distance = calculateDistance(userLat, userLng, VEGAS_COORDS.lat, VEGAS_COORDS.lng);
        const closestNeighborhood = detectClosestNeighborhood(userLat, userLng);
        
        const locationData = {
          latitude: userLat,
          longitude: userLng,
          distanceFromVegas: Math.round(distance),
          isInVegas: distance <= 30,
          city: distance <= 30 ? 'Las Vegas' : 'Outside Vegas',
          detectedNeighborhood: closestNeighborhood.name,
          selectedArea: closestNeighborhood.name,
          detectedAt: new Date().toISOString()
        };
        
        setLocation(locationData);
        setLoading(false);
        setUserSelected(false);
        
        localStorage.setItem('hybridhunting-location', JSON.stringify(locationData));
      },
      (error) => {
        setLoading(false);
        if (error.code === 1) {
          setPermissionDenied(true);
          setError('Location access denied. Please enable location services or select manually.');
        } else {
          setError('Unable to retrieve your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectVegasManually = () => {
    const locationData = {
      ...VEGAS_COORDS,
      distanceFromVegas: 0,
      isInVegas: true,
      city: 'Las Vegas',
      selectedArea: 'The Strip',
      manuallySelected: true,
      selectedAt: new Date().toISOString()
    };
    
    setLocation(locationData);
    setUserSelected(true);
    setError('');
    localStorage.setItem('hybridhunting-location', JSON.stringify(locationData));
  };

  const clearLocation = () => {
    setLocation(null);
    setUserSelected(false);
    setError('');
    localStorage.removeItem('hybridhunting-location');
  };

  const updateSelectedArea = (area) => {
    const updatedLocation = { ...location, selectedArea: area };
    setLocation(updatedLocation);
    localStorage.setItem('hybridhunting-location', JSON.stringify(updatedLocation));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#2A2A2A] flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Your Vegas Location
        </h3>
        {location && (
          <button
            onClick={clearLocation}
            className="text-gray-400 hover:text-gray-600"
            title="Clear location"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8D8C0] mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Detecting your location...</p>
        </div>
      ) : location ? (
        <div className={`p-4 rounded-lg ${location.isInVegas ? 'bg-[#F0F8E8]' : 'bg-[#FFF8E6]'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${location.isInVegas ? 'bg-[#C8D8C0]' : 'bg-[#EDBD8F]'}`}>
              {location.isInVegas ? (
                <Check className="w-5 h-5 text-[#2A2A2A]" />
              ) : (
                <MapPin className="w-5 h-5 text-[#2A2A2A]" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-[#2A2A2A]">
                {location.isInVegas ? '🎰 You\'re in Vegas!' : '📍 Outside Vegas'}
              </p>
              <p className="text-sm text-gray-600">
                {location.isInVegas 
                  ? `Detected near ${location.detectedNeighborhood || 'Las Vegas'}`
                  : `You're ${location.distanceFromVegas} miles from Vegas`}
              </p>
              {userSelected && (
                <p className="text-xs text-gray-500 mt-1">(Manually selected)</p>
              )}
            </div>
          </div>
          
          {location.isInVegas && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select your area:
                  </label>
                  <select
                    value={location.selectedArea || 'The Strip'}
                    onChange={(e) => updateSelectedArea(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    {VEGAS_NEIGHBORHOODS.map(area => (
                      <option key={area.name} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Showing deals available in {location.selectedArea}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={detectLocation}
                    className="flex items-center justify-center gap-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    <Navigation className="w-3 h-3" />
                    Re-detect
                  </button>
                  <button
                    onClick={selectVegasManually}
                    className="py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Change Area
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Enable location to see cannabis deals available in your area of Las Vegas
            </p>
            
            <div className="space-y-3">
              <button
                onClick={detectLocation}
                className="w-full py-3 bg-[#C8D8C0] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Detect My Location
              </button>
              
              <div className="text-sm text-gray-600">or</div>
              
              <button
                onClick={selectVegasManually}
                className="w-full py-3 bg-[#EDBD8F] text-[#2A2A2A] font-bold rounded-lg hover:opacity-90"
              >
                Select Vegas Manually
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              We'll show you dispensaries and deals available in your selected area
            </p>
          </div>
        </div>
      )}
    </div>
  );
}