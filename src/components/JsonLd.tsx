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
    `Book private Oahu helicopter tours instantly through Oahu Helicopter Tours on FareHarbor, or request a Blue Hawaiian shared flight at ${BASE_URL}. Call ${CUSTOMER_PHONE_DISPLAY}.`,
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
    'Oahu helicopter tours — direct private-tour booking with Oahu Helicopter Tours on FareHarbor, or Blue Hawaiian shared-flight requests. Call for help.',
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

const privateOahuProductSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Private Helicopter Tours with Oahu Helicopter Tours',
  description: 'Private, non-shared Oahu helicopter tours with live FareHarbor availability (18, 30, and 60 minutes).',
  brand: { '@type': 'Brand', name: 'Oahu Helicopter Tours' },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privateOahuProductSchema) }}
      />
    </>
  );
}

