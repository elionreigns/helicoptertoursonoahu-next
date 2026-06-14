/**
 * JSON-LD structured data for SEO (Organization, WebSite, LocalBusiness).
 * Rendered in layout so all pages get the base schema.
 */
import { CUSTOMER_PHONE_DISPLAY, CUSTOMER_PHONE_SCHEMA } from '@/lib/constants';
import { fareHarborTrackedOutboundUrl } from '@/lib/partnerLinks';

const BASE_URL = 'https://booking.helicoptertoursonoahu.com';
const MAIN_SITE = 'https://www.helicoptertoursonoahu.com';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Helicopter Tours on Oahu',
  url: MAIN_SITE,
  logo: `${MAIN_SITE}/images/helicoptertours-bluehawaiian.webp`,
  description:
    `Book Oahu helicopter tours instantly on FareHarbor (Honolulu Helicopter Tours) or request Blue Hawaiian Eco-Star flights at ${BASE_URL}. Call ${CUSTOMER_PHONE_DISPLAY}.`,
  telephone: CUSTOMER_PHONE_SCHEMA,
  sameAs: [MAIN_SITE],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: CUSTOMER_PHONE_SCHEMA,
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
    `Book Oahu helicopter tours on FareHarbor (live seats) or request Blue Hawaiian flights. Call ${CUSTOMER_PHONE_DISPLAY}.`,
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
    'Oahu helicopter tours — instant FareHarbor booking with Honolulu Helicopter Tours or Blue Hawaiian Eco-Star requests. Call for help.',
  url: MAIN_SITE,
  telephone: CUSTOMER_PHONE_SCHEMA,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '99 Kaulele Place',
    addressLocality: 'Honolulu',
    addressRegion: 'HI',
    postalCode: '96819',
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

const honoluluProductSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Honolulu Helicopter Tours — Oahu Scenic Flight',
  description: 'Shared Oahu helicopter flights with live FareHarbor availability (18, 30, 60 min).',
  brand: { '@type': 'Brand', name: 'Honolulu Helicopter Tours' },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '244',
    highPrice: '356',
    availability: 'https://schema.org/InStock',
    url: fareHarborTrackedOutboundUrl('schema-booking'),
  },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(honoluluProductSchema) }}
      />
    </>
  );
}
