/**
 * Tour configuration with pricing and operator information
 * Used for booking form dropdowns and price calculations
 */

export interface Tour {
  id: string;
  name: string;
  operator: 'blueHawaiian' | 'rainbow';
  island: string;
  pricePerPerson: number; // Base price per person
  duration?: string;
  description?: string;
  doorsOff?: boolean;
  fareHarborUrl?: string; // For availability checking
}

/**
 * Tour catalog with pricing
 * Prices are approximate - verify with operator for current rates
 */
export const tours: Tour[] = [
  // Blue Hawaiian - Oahu Tours
  {
    id: 'bhh-oahu-blue-skies',
    name: 'Blue Skies of Oahu',
    operator: 'blueHawaiian',
    island: 'Oahu',
    pricePerPerson: 299,
    duration: '45-50 minutes',
    description: 'Scenic flight over Oahu\'s most beautiful locations',
    doorsOff: false,
  },
  {
    id: 'bhh-oahu-complete',
    name: 'Complete Island Oahu',
    operator: 'blueHawaiian',
    island: 'Oahu',
    pricePerPerson: 399,
    duration: '60-65 minutes',
    description: 'Complete island tour covering all major landmarks',
    doorsOff: false,
  },
  {
    id: 'bhh-oahu-air-adventure',
    name: 'Oahu Air Adventure',
    operator: 'blueHawaiian',
    island: 'Oahu',
    pricePerPerson: 349,
    duration: '50-55 minutes',
    description: 'Adventure tour with doors-off option available',
    doorsOff: true,
  },
  {
    id: 'bhh-oahu-north-shore',
    name: 'Discover North Shore',
    operator: 'blueHawaiian',
    island: 'Oahu',
    pricePerPerson: 329,
    duration: '45-50 minutes',
    description: 'Explore the famous North Shore beaches and surf spots',
    doorsOff: false,
  },
  {
    id: 'bhh-oahu-landing-experience',
    name: 'Laukiha\'a Farm - Landing Experience',
    operator: 'blueHawaiian',
    island: 'Oahu',
    pricePerPerson: 449,
    duration: '60-65 minutes',
    description: 'Includes landing at Laukiha\'a Farm',
    doorsOff: false,
  },
  {
    id: 'bhh-oahu-landing-adventure',
    name: 'Laukiha\'a Farm - Landing Adventure',
    operator: 'blueHawaiian',
    island: 'Oahu',
    pricePerPerson: 499,
    duration: '65-70 minutes',
    description: 'Extended adventure with farm landing',
    doorsOff: true,
  },
  
  // Blue Hawaiian - Big Island Tours
  {
    id: 'bhh-big-island-spectacular',
    name: 'Big Island Spectacular (Waikoloa)',
    operator: 'blueHawaiian',
    island: 'Big Island',
    pricePerPerson: 399,
    duration: '50-55 minutes',
    description: 'Volcano and waterfall tour from Waikoloa',
    doorsOff: false,
  },
  {
    id: 'bhh-kona-coast',
    name: 'Kona Coast Hualalai',
    operator: 'blueHawaiian',
    island: 'Big Island',
    pricePerPerson: 349,
    duration: '45-50 minutes',
    description: 'Coastal tour of Kona and Hualalai',
    doorsOff: false,
  },
  {
    id: 'bhh-discover-hilo',
    name: 'Discover Hilo',
    operator: 'blueHawaiian',
    island: 'Big Island',
    pricePerPerson: 299,
    duration: '40-45 minutes',
    description: 'Hilo waterfalls and rainforest',
    doorsOff: false,
  },
  {
    id: 'bhh-hilo-waterfall',
    name: 'Hilo Waterfall Experience',
    operator: 'blueHawaiian',
    island: 'Big Island',
    pricePerPerson: 329,
    duration: '45-50 minutes',
    description: 'Focused waterfall and rainforest tour',
    doorsOff: false,
  },
  
  // Blue Hawaiian - Maui Tours
  {
    id: 'bhh-maui-waterfalls',
    name: 'Waterfalls of West Maui and Molokai',
    operator: 'blueHawaiian',
    island: 'Maui',
    pricePerPerson: 299,
    duration: '45-50 minutes',
    description: 'Waterfall tour over West Maui and Molokai',
    doorsOff: false,
  },
  {
    id: 'bhh-maui-spectacular',
    name: 'Maui and Molokai Spectacular',
    operator: 'blueHawaiian',
    island: 'Maui',
    pricePerPerson: 349,
    duration: '50-55 minutes',
    description: 'Complete Maui and Molokai experience',
    doorsOff: false,
  },
  {
    id: 'bhh-majestic-maui',
    name: 'Majestic Maui',
    operator: 'blueHawaiian',
    island: 'Maui',
    pricePerPerson: 399,
    duration: '60-65 minutes',
    description: 'Extended Maui tour',
    doorsOff: false,
  },
  {
    id: 'bhh-hana-rainforest',
    name: 'Hana Rainforest',
    operator: 'blueHawaiian',
    island: 'Maui',
    pricePerPerson: 329,
    duration: '45-50 minutes',
    description: 'Hana rainforest and coastline',
    doorsOff: false,
  },
  
  // Blue Hawaiian - Kauai Tours
  {
    id: 'bhh-discover-kauai',
    name: 'Discover Kauai',
    operator: 'blueHawaiian',
    island: 'Kauai',
    pricePerPerson: 299,
    duration: '45-50 minutes',
    description: 'Complete Kauai island tour',
    doorsOff: false,
  },
  {
    id: 'bhh-kauai-eco',
    name: 'Kauai Eco Adventure',
    operator: 'blueHawaiian',
    island: 'Kauai',
    pricePerPerson: 349,
    duration: '50-55 minutes',
    description: 'Eco-focused Kauai adventure',
    doorsOff: false,
  },
  
  // Rainbow Helicopters - Oahu Tours
  {
    id: 'rainbow-oahu-doors-off',
    name: 'Oahu Doors-Off Adventure',
    operator: 'rainbow',
    island: 'Oahu',
    pricePerPerson: 249,
    duration: '45 minutes',
    description: 'Doors-off adventure tour of Oahu',
    doorsOff: true,
  },
  {
    id: 'rainbow-oahu-scenic',
    name: 'Oahu Scenic Tour',
    operator: 'rainbow',
    island: 'Oahu',
    pricePerPerson: 229,
    duration: '40 minutes',
    description: 'Scenic doors-on tour',
    doorsOff: false,
  },
  {
    id: 'rainbow-oahu-complete',
    name: 'Complete Oahu Experience',
    operator: 'rainbow',
    island: 'Oahu',
    pricePerPerson: 299,
    duration: '60 minutes',
    description: 'Complete island tour with doors-off option',
    doorsOff: true,
  },
];

/**
 * Get tours by operator
 */
export function getToursByOperator(operator: 'blueHawaiian' | 'rainbow'): Tour[] {
  return tours.filter(tour => tour.operator === operator);
}

/**
 * Get tour by ID
 */
export function getTourById(id: string): Tour | undefined {
  return tours.find(tour => tour.id === id);
}

/**
 * Calculate total price for a tour booking
 */
export function calculateTotalPrice(tourId: string, partySize: number): number {
  const tour = getTourById(tourId);
  if (!tour) return 0;
  return tour.pricePerPerson * partySize;
}

/**
 * Get tours for a specific island
 */
export function getToursByIsland(island: string): Tour[] {
  return tours.filter(tour => tour.island === island);
}
