/**
 * FareHarbor calendar URLs for Blue Hawaiian Helicopters tours
 * These URLs are used for live availability checking via Browserbase
 */

export interface FareHarborTour {
  name: string;
  url: string;
  operator: 'blueHawaiian';
  island?: string;
}

/**
 * Map of Blue Hawaiian tour names to FareHarbor calendar URLs
 * Update the year/month in URLs as needed (currently set to 2026/01)
 */
export const fareHarborTours: Record<string, FareHarborTour> = {
  // Big Island Tours
  'Big Island Spectacular (Waikoloa)': {
    name: 'Big Island Spectacular (Waikoloa)',
    url: 'https://fareharbor.com/embeds/book/bhh-waikoloa/items/335770/calendar/2026/01/?ref=activitycard&flow=764853&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Big Island',
  },
  'Kona Coast Hualalai': {
    name: 'Kona Coast Hualalai',
    url: 'https://fareharbor.com/embeds/book/bhh-waikoloa/items/337272/calendar/2026/01/?ref=activitycard&flow=764869&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Big Island',
  },
  'Discover Hilo': {
    name: 'Discover Hilo',
    url: 'https://fareharbor.com/embeds/book/bhh-hilo/items/319529/calendar/2026/01/?ref=activitycard&flow=599289&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Big Island',
  },
  'Hilo Waterfall Experience': {
    name: 'Hilo Waterfall Experience',
    url: 'https://fareharbor.com/embeds/book/bhh-hilo/items/512241/calendar/2026/01/?ref=activitycard&flow=no&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Big Island',
  },
  'Waterfalls and Volcano by Air and Land': {
    name: 'Waterfalls and Volcano by Air and Land',
    url: 'https://fareharbor.com/embeds/book/bhh-waikoloa/items/581592/calendar/2026/01/?full-items=yes&back=https://www.bluehawaiian.com/en/tours&flow=1280602&g4=yes',
    operator: 'blueHawaiian',
    island: 'Big Island',
  },
  'Private Charters Big Island': {
    name: 'Private Charters Big Island',
    url: 'https://fareharbor.com/embeds/book/bhh-waikoloa/items/586203/calendar/2026/01/?full-items=yes&back=https://www.bluehawaiian.com/en/tours&flow=1280602&g4=yes',
    operator: 'blueHawaiian',
    island: 'Big Island',
  },
  
  // Maui Tours
  'Waterfalls of West Maui and Molokai': {
    name: 'Waterfalls of West Maui and Molokai',
    url: 'https://fareharbor.com/embeds/book/bhh-maui/items/338577/calendar/2026/01/?ref=activitycard&flow=640927&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Maui',
  },
  'Maui and Molokai Spectacular': {
    name: 'Maui and Molokai Spectacular',
    url: 'https://fareharbor.com/embeds/book/bhh-maui/items/338576/calendar/2026/01/?flow=640927&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Maui',
  },
  'Majestic Maui': {
    name: 'Majestic Maui',
    url: 'https://fareharbor.com/embeds/book/bhh-maui/items/575438/calendar/2026/01/?flow=no&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Maui',
  },
  'Hana Rainforest': {
    name: 'Hana Rainforest',
    url: 'https://fareharbor.com/embeds/book/bhh-maui/items/338571/calendar/2026/01/?flow=640927&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Maui',
  },
  'Maui Nui': {
    name: 'Maui Nui',
    url: 'https://fareharbor.com/embeds/book/bhh-maui/items/622923/calendar/2026/01/?ref=activitycard&flow=640927&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Maui',
  },
  
  // Oahu Tours
  'Blue Skies of Oahu': {
    name: 'Blue Skies of Oahu',
    url: 'https://fareharbor.com/embeds/book/bhh-oahu/items/338625/calendar/2026/01/?ref=activitycard&flow=641101&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Oahu',
  },
  'Complete Island Oahu': {
    name: 'Complete Island Oahu',
    url: 'https://fareharbor.com/embeds/book/bhh-oahu/items/338654/calendar/2026/01/?ref=activitycard&flow=641101&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Oahu',
  },
  'Oahu Air Adventure': {
    name: 'Oahu Air Adventure',
    url: 'https://fareharbor.com/embeds/book/bhh-turtlebay/items/524472/calendar/2026/01/?ref=activitycard&flow=1122375&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Oahu',
  },
  'Discover North Shore': {
    name: 'Discover North Shore',
    url: 'https://fareharbor.com/embeds/book/bhh-turtlebay/items/524184/calendar/2026/01/?ref=activitycard&flow=1122375&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Oahu',
  },
  'Laukiha\'a Farm - Landing Experience': {
    name: 'Laukiha\'a Farm - Landing Experience',
    url: 'https://fareharbor.com/embeds/book/bhh-oahu/items/574079/calendar/2026/01/?ref=activitycard&flow=641101&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Oahu',
  },
  'Laukiha\'a Farm - Landing Adventure': {
    name: 'Laukiha\'a Farm - Landing Adventure',
    url: 'https://fareharbor.com/embeds/book/bhh-turtlebay/items/675431/calendar/2026/01/?ref=activitycard&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Oahu',
  },
  
  // Kauai Tours
  'Discover Kauai': {
    name: 'Discover Kauai',
    url: 'https://fareharbor.com/embeds/book/bhh-princeville/items/434344/calendar/2026/01/?ref=activitycard&flow=882862&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Kauai',
  },
  'Kauai Eco Adventure': {
    name: 'Kauai Eco Adventure',
    url: 'https://fareharbor.com/embeds/book/bhh-kauai/items/338770/calendar/2026/01/?ref=activitycard&flow=641420&language=en-us&full-items=yes&back=https://www.bluehawaiian.com/en/tours&g4=yes',
    operator: 'blueHawaiian',
    island: 'Kauai',
  },
};

/**
 * Get FareHarbor URL for a tour name
 * Returns null if tour not found
 */
export function getFareHarborUrl(tourName: string): string | null {
  const tour = fareHarborTours[tourName];
  return tour ? tour.url : null;
}

/**
 * Update URL year/month dynamically
 * FareHarbor URLs need the year/month updated based on the requested date
 */
export function updateFareHarborUrlForDate(url: string, date: string): string {
  // Extract year and month from date (YYYY-MM-DD format)
  const [year, month] = date.split('-');
  // Replace year/month in URL (format: calendar/2026/01/)
  return url.replace(/calendar\/\d{4}\/\d{2}\//, `calendar/${year}/${month}/`);
}
