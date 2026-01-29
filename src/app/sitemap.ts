import { MetadataRoute } from 'next';

const BASE = 'https://booking.helicoptertoursonoahu.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/bookings`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/bookings/success`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
}
