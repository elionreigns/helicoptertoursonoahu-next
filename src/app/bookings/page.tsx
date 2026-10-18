import BookingForm from '@/components/BookingForm';
import HonoluluPartnerCard from '@/components/HonoluluPartnerCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Oahu Helicopter Tours',
  description:
    'Request a Blue Hawaiian shared helicopter flight. For a private Oahu Helicopter Tours flight with live availability, use the FareHarbor options on this page.',
  openGraph: {
    title: 'Book Oahu Helicopter Tours | Helicopter Tours on Oahu',
    description: 'Request a Blue Hawaiian shared flight or book a private Oahu Helicopter Tours flight live through FareHarbor.',
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
            <strong>Private flight:</strong> use the FareHarbor options above for Oahu Helicopter Tours — live availability and direct checkout.
            <strong>Blue Hawaiian shared flight:</strong> submit the request below and our team will follow up by phone.
          </p>
        </div>

        <div className="mb-10 -mt-2">
          <HonoluluPartnerCard />
        </div>

        <div className="max-w-3xl mx-auto mb-12 rounded-xl border border-blue-200 bg-blue-50/80 px-5 py-6 text-center text-gray-800">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Blue Hawaiian Helicopters</h2>
          <p className="text-sm sm:text-base leading-relaxed">
            Use this form for a <strong>Blue Hawaiian shared flight with other guests</strong>. It is a request, not a confirmed reservation; our team follows up by phone.
            For other partnership inquiries, your team can use archived materials on the main site under pending vendors.
          </p>
        </div>

        <BookingForm />
      </main>
    </div>
  );
}
