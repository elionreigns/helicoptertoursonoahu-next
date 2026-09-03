import BookingForm from '@/components/BookingForm';
import type { Metadata } from 'next';
import { FAREHARBOR_PRIVATE_ALL } from '@/lib/partnerLinks';

export const metadata: Metadata = {
  title: 'Book Oahu Helicopter Tours',
  description:
    'Book your Oahu helicopter tour with Blue Hawaiian Helicopters. Fill out the form—we confirm availability and send your reference code. Tours on Oʻahu, Maui, Kauaʻi, and the Big Island.',
  openGraph: {
    title: 'Book Oahu Helicopter Tours | Helicopter Tours on Oahu',
    description: 'Book with Blue Hawaiian Helicopters. Submit your request—we confirm availability and follow up by email.',
    url: 'https://booking.helicoptertoursonoahu.com/bookings',
  },
  alternates: { canonical: 'https://booking.helicoptertoursonoahu.com/bookings' },
};

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Book Your Oahu Helicopter Tour
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Submit your Blue Hawaiian request below. We&apos;ll confirm availability and email your reference code; nothing is booked until the operator confirms it.
          </p>
          <a
            href={FAREHARBOR_PRIVATE_ALL}
            className="fareharbor-lightframe mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-6 py-3 font-extrabold text-slate-950 shadow-sm transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200"
          >
            Book Private Helicopter Here
          </a>
          <p className="mt-3 text-sm text-gray-500">Want a private, non-shared flight with live availability? This opens the FareHarbor booking window.</p>
        </div>

        <div className="max-w-3xl mx-auto mb-12 rounded-xl border border-blue-200 bg-blue-50/80 px-5 py-6 text-center text-gray-800">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Blue Hawaiian Helicopters</h2>
          <p className="text-sm sm:text-base leading-relaxed">
            New bookings on this site use <strong>Blue Hawaiian</strong> (luxury Eco-Star fleet). After you submit the form, we confirm availability and email next steps.
            For other partnership inquiries, your team can use archived materials on the main site under pending vendors.
          </p>
        </div>

        <BookingForm />
      </main>
    </div>
  );
}
