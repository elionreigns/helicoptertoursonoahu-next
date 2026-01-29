/**
 * JSON-LD structured data for SEO (Organization, WebSite, LocalBusiness).
 * Rendered in layout so all pages get the base schema.
 */
const BASE_URL = 'https://booking.helicoptertoursonoahu.com';
const MAIN_SITE = 'https://www.helicoptertoursonoahu.com';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Helicopter Tours on Oahu',
  url: MAIN_SITE,
  logo: `${MAIN_SITE}/images/helicoptertours-bluehawaiian.webp`,
  description:
    'Your premier source for helicopter tours on Oahu. Book Oahu helicopter tours with Blue Hawaiian Helicopters and Rainbow Helicopters. Compare tours, prices, and book online or by phone.',
  telephone: '+1-707-381-2583',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-707-381-2583',
    contactType: 'booking',
    areaServed: 'US-HI',
    availableLanguage: 'English',
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Helicopter Tours on Oahu - Book Online',
  url: BASE_URL,
  description:
    'Book helicopter tours on Oahu with Blue Hawaiian and Rainbow Helicopters. Safe, scenic Oahu helicopter tours. Compare and book online.',
  publisher: {
    '@type': 'Organization',
    name: 'Helicopter Tours on Oahu',
    url: MAIN_SITE,
  },
  potentialAction: {
    '@type': 'ReserveAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/bookings`,
      actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
    },
    result: {
      '@type': 'Reservation',
      name: 'Helicopter Tour Booking',
    },
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  name: 'Helicopter Tours on Oahu',
  description:
    'Oahu helicopter tours with Blue Hawaiian and Rainbow Helicopters. Book Hawaii helicopter tours—Oahu, Maui, Kauai, Big Island. Safe, scenic, personalized. Book online or call.',
  url: MAIN_SITE,
  telephone: '+1-707-381-2583',
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'HI',
    addressLocality: 'Oahu',
    addressCountry: 'US',
  },
  areaServed: [
    { '@type': 'Place', name: 'Oahu' },
    { '@type': 'Place', name: 'Maui' },
    { '@type': 'Place', name: 'Kauai' },
    { '@type': 'Place', name: 'Big Island' },
  ],
  image: `${MAIN_SITE}/images/helicoptertours-bluehawaiian.webp`,
};

export default function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  );
}
