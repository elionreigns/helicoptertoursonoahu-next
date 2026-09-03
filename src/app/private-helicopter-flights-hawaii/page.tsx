import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  FAREHARBOR_PRIVATE_18,
  FAREHARBOR_PRIVATE_30,
  FAREHARBOR_PRIVATE_60,
  FAREHARBOR_PRIVATE_ALL,
} from '@/lib/partnerLinks';

export const metadata: Metadata = {
  title: 'Honolulu Heli Private Flights | Oahu Luxury Tours',
  description: 'Choose Honolulu Heli private flights for an elevated Oahu experience: your group, your moment, and spectacular island views. Choose 18-, 30-, or 60-minute flights.',
  keywords: ['private helicopter flights Hawaii', 'private helicopter tours Oahu', 'Oahu luxury helicopter tour', 'private Hawaii helicopter charter', 'book private helicopter Oahu'],
  alternates: { canonical: '/private-helicopter-flights-hawaii' },
  openGraph: {
    title: 'Honolulu Heli Private Flights | Oahu Luxury Tours',
    description: 'A more personal way to see Oahu: private helicopter flights for your group and your Hawaii moment.',
    url: '/private-helicopter-flights-hawaii',
    images: [{ url: '/images/private-helicopter-flights/oahu-windward-coast-helicopter-hero.png', width: 1600, height: 900, alt: 'Private helicopter aerial view of the Oahu coastline and Koʻolau Mountains' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Honolulu Heli Private Flights | Oahu Luxury Tours',
    description: 'A more personal way to see Oahu from the air.',
    images: ['/images/private-helicopter-flights/oahu-windward-coast-helicopter-hero.png'],
  },
};

const flights = [
  { title: '18-Minute Private Flight', detail: 'A private, scenic Oahu flight when time is short.', href: FAREHARBOR_PRIVATE_18, image: '/images/private-helicopter-flights/koolau-rainforest-helicopter-view.png', alt: 'Private helicopter view of the green Koʻolau Mountains on Oahu' },
  { title: '30-Minute Private Flight', detail: 'More time for a personal Oahu aerial experience.', href: FAREHARBOR_PRIVATE_30, image: '/images/private-helicopter-flights/lanikai-mokulua-aerial-view.png', alt: 'Aerial helicopter view of Lanikai-style turquoise water and offshore islets on Oahu' },
  { title: '60-Minute Private Flight', detail: 'A longer private flight for guests seeking more of Oahu from above.', href: FAREHARBOR_PRIVATE_60, image: '/images/private-helicopter-flights/north-shore-sunset-aerial-view.png', alt: 'Private helicopter aerial view of Oahu North Shore coastline at sunset' },
];

export default function PrivateFlightsHawaiiPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Private Helicopter Flights Hawaii',
    url: 'https://booking.helicoptertoursonoahu.com/private-helicopter-flights-hawaii',
    description: 'Honolulu Heli private helicopter flight options for a more personal Oahu experience.',
    areaServed: { '@type': 'Place', name: 'Oahu, Hawaii' },
    provider: { '@type': 'Organization', name: 'Helicopter Tours on Oahu', url: 'https://booking.helicoptertoursonoahu.com' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: 'Private Oahu helicopter flights',
      itemListElement: flights.map((flight) => ({ '@type': 'Offer', name: flight.title, url: flight.href })),
    },
  };

  return (
    <main className="flex-1 bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="relative isolate overflow-hidden">
        <Image src="/images/private-helicopter-flights/oahu-windward-coast-helicopter-hero.png" alt="Private helicopter aerial view of the Oahu coastline and Koʻolau Mountains" width={1600} height={900} priority className="absolute inset-0 -z-20 h-full w-full object-cover" sizes="100vw" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/35" />
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 lg:py-36">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-amber-300 sm:text-sm">Honolulu Heli private flights</p>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">Private Oahu. The way a once-in-a-lifetime view should feel.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg sm:leading-8">Step into a private Honolulu Heli flight with the people you chose to travel with. No shared cabin, no strangers in your moment—just an unforgettable new perspective on Oahu.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={FAREHARBOR_PRIVATE_ALL} className="fareharbor-lightframe inline-flex min-h-14 items-center justify-center rounded-xl bg-amber-400 px-6 py-4 text-center font-extrabold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200">Book Private Helicopter Here</a>
            <Link href="/bookings" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/40 px-6 py-4 text-center font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30">Request a Blue Hawaiian shared flight</Link>
          </div>
          <p className="mt-5 text-sm text-slate-200">Easy phone shortcut: <a className="font-bold text-amber-300 underline underline-offset-4 hover:text-amber-200" href="https://tinyurl.com/privatehelicopterhawaii">tinyurl.com/privatehelicopterhawaii</a></p>
        </div>
      </section>
      <section className="bg-white py-14 text-slate-950 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Honolulu Heli private flights</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Choose the private flight that fits your day.</h2><p className="mt-4 text-lg leading-8 text-slate-600">Whether you have a quick window or want to turn the flight into the highlight of your Oahu trip, choose the length that feels right for your group.</p></div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {flights.map((flight) => <article key={flight.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><Image src={flight.image} alt={flight.alt} width={1200} height={675} className="h-48 w-full object-cover" sizes="(min-width: 768px) 33vw, 100vw" /><div className="p-6"><h3 className="text-xl font-extrabold">{flight.title}</h3><p className="mt-3 min-h-12 text-slate-600">{flight.detail}</p><a href={flight.href} className="fareharbor-lightframe mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-center font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300">Check live availability</a></div></article>)}
          </div>
        </div>
      </section>
      <section className="bg-slate-100 py-14 text-slate-950 sm:py-20"><div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center"><Image src="/images/private-helicopter-flights/waikiki-diamond-head-aerial-view.png" alt="Aerial helicopter view of the Waikiki and Diamond Head coastline on Oahu" width={1600} height={900} className="rounded-2xl object-cover shadow-lg" sizes="(min-width: 1024px) 50vw, 100vw" /><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Why private feels different</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">More than a seat: your own sky-high Hawaii moment.</h2><p className="mt-5 leading-8 text-slate-700">Shared flights can be wonderful. A private Honolulu Heli flight is for when you want the experience to feel more personal: your own group, the people you came with, and the freedom to make the memory together.</p><p className="mt-4 leading-8 text-slate-700">It is the upgrade for anniversaries, proposals, family trips, milestone birthdays, or anyone who would rather look out at Oahu than around at unfamiliar seatmates. The view is bigger when it feels like it belongs to your day.</p><h2 className="mt-8 text-2xl font-black">Ready when you are</h2><p className="mt-4 leading-8 text-slate-700">Pick 18, 30, or 60 minutes, then select your date in the private booking window.</p></div></div></section>
      <section className="bg-slate-950 py-14 text-white sm:py-20"><div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300">See more of Oahu</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">A private seat for the views you came to Hawaii to see.</h2><p className="mt-5 leading-8 text-slate-200">Oahu has the kind of scenery that changes quickly from the air: green mountain ridges, waterfalls after rain, dramatic cliffs, and long stretches of Pacific coastline. The team behind these private flights knows the island from the cockpit and loves showing visitors the places that are hard to appreciate from the road.</p><p className="mt-4 leading-8 text-slate-200">It is a relaxed way to mark a big trip, share Hawaii with family or friends, or simply trade a crowded itinerary for a view that feels entirely your own.</p><p className="mt-4 text-sm leading-6 text-slate-400">Actual sights, route, and conditions depend on the flight you select, weather, and live operator guidance. Check FareHarbor for current flight details.</p></div><Image src="/images/private-helicopter-flights/koolau-rainforest-helicopter-view.png" alt="Private helicopter view of the green Koʻolau Mountains on Oahu" width={1600} height={900} className="rounded-2xl object-cover shadow-lg" sizes="(min-width: 1024px) 50vw, 100vw" /></div></section>
      <section className="bg-white py-14 text-slate-950 sm:py-20"><div className="mx-auto max-w-4xl px-5 sm:px-8"><h2 className="text-3xl font-black tracking-tight sm:text-4xl">Private helicopter flight questions</h2><div className="mt-8 space-y-3"><details className="rounded-xl border border-slate-200 bg-slate-50 p-5"><summary className="cursor-pointer font-bold">Can I see private-flight availability before booking?</summary><p className="mt-3 leading-7 text-slate-700">Yes. Use any private-flight button to open the live FareHarbor booking window and view current dates.</p></details><details className="rounded-xl border border-slate-200 bg-slate-50 p-5"><summary className="cursor-pointer font-bold">Does the booking window open on this site?</summary><p className="mt-3 leading-7 text-slate-700">Yes. The FareHarbor Lightframe modal is included so customers can browse and check out without being sent away from this page.</p></details><details className="rounded-xl border border-slate-200 bg-slate-50 p-5"><summary className="cursor-pointer font-bold">I want a shared Blue Hawaiian flight instead.</summary><p className="mt-3 leading-7 text-slate-700">Use the <Link href="/bookings" className="font-bold text-blue-700 underline">Blue Hawaiian shared-flight request</Link>. It is a follow-up request, not a confirmed reservation.</p></details></div></div></section>
    </main>
  );
}
