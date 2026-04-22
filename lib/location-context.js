'use client';

import { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedArea, setSelectedArea] = useState('The Strip');

  // Vegas neighborhoods/areas
  const VEGAS_AREAS = [
    'The Strip',
    'Downtown/Fremont',
    'Summerlin',
    'Henderson',
    'North Las Vegas',
    'Spring Valley',
    'Paradise',
    'Enterprise'
  ];

  const value = {
    userLocation,
    setUserLocation,
    selectedArea,
    setSelectedArea,
    vegasAreas: VEGAS_AREAS,
    isInVegas: userLocation?.isInVegas || false
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}