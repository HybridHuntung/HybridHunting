// lib/location-service.js
export const STATES = {
  NV: { name: 'Nevada', cities: ['Las Vegas', 'Reno', 'Henderson'] },
  CA: { name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego'] },
  CO: { name: 'Colorado', cities: ['Denver', 'Boulder', 'Aspen'] },
  WA: { name: 'Washington', cities: ['Seattle', 'Spokane', 'Tacoma'] },
  OR: { name: 'Oregon', cities: ['Portland', 'Eugene', 'Bend'] }
  // Add more states as you expand
};

export function getStateFromCity(city) {
  const stateMap = {
    'Las Vegas': 'NV',
    'Reno': 'NV',
    'Henderson': 'NV',
    'Los Angeles': 'CA',
    'San Francisco': 'CA',
    'San Diego': 'CA',
    'Denver': 'CO',
    'Seattle': 'WA',
    'Portland': 'OR'
  };
  return stateMap[city] || 'NV';
}

export function getNeighborhoods(city) {
  const neighborhoods = {
    'Las Vegas': [
      'The Strip',
      'Downtown/Fremont',
      'Summerlin',
      'Henderson',
      'North Las Vegas',
      'Spring Valley',
      'Enterprise',
      'Paradise',
      'Centennial Hills'
    ],
    'Los Angeles': [
      'Hollywood',
      'Downtown LA',
      'West LA',
      'Venice',
      'Santa Monica',
      'San Fernando Valley'
    ],
    'Denver': [
      'Downtown',
      'Highlands',
      'RiNo',
      'Cherry Creek',
      'Cap Hill'
    ]
    // Add more cities as you expand
  };
  
  return neighborhoods[city] || [city];
}