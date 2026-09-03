import type { Metadata } from 'next';
import {
  FAREHARBOR_PRIVATE_18,
  FAREHARBOR_PRIVATE_30,
  FAREHARBOR_PRIVATE_60,
  FAREHARBOR_PRIVATE_ALL,
} from '@/lib/partnerLinks';

export const metadata: Metadata = {
  title: 'Private Helicopter Flights | Live Availability',
  description: 'Book a private Oahu helicopter flight with live FareHarbor availability and checkout.',
};

const flights = [
  { title: '18-Minute Private Flight', detail: 'A fast, private aerial escape over Oahu.', href: FAREHARBOR_PRIVATE_18 },
  { title: '30-Minute Private Flight', detail: 'More time for a private scenic experience.', href: FAREHARBOR_PRIVATE_30 },
  { title: '60-Minute Private Flight', detail: 'The full luxury private-flight experience.', href: FAREHARBOR_PRIVATE_60 },
];

export default function PrivateFlightsPage() {
  return (
    <main className="flex-1 bg-slate-950 text-white">
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Private Oahu helicopter flights</p>
        <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Your helicopter. Your guests. Your adventure.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
          Choose a private flight and see live availability in the secure FareHarbor booking window. Checkout and confirmation happen directly there.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={FAREHARBOR_PRIVATE_ALL} className="fareharbor-lightframe rounded-xl bg-amber-400 px-6 py-4 font-extrabold text-slate-950 transition hover:bg-amber-300">
            Book Private Helicopter Here
          </a>
          <a href="/bookings" className="rounded-xl border border-white/30 px-6 py-4 font-bold text-white transition hover:bg-white/10">
            Need a regular Blue Hawaiian flight?
          </a>
        </div>
        <p className="mt-5 text-sm text-slate-400">Easy link to share by phone: booking.helicoptertoursonoahu.com/p</p>
      </section>

      <section className="bg-white py-12 text-slate-950 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-5 px-5 md:grid-cols-3">
          {flights.map((flight) => (
            <article key={flight.title} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-extrabold">{flight.title}</h2>
              <p className="mt-3 min-h-12 text-slate-600">{flight.detail}</p>
              <a href={flight.href} className="fareharbor-lightframe mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-700">
                Check live availability
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
