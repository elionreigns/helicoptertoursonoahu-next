import BookingForm from '@/components/BookingForm';
import type { Metadata } from 'next';

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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Book Your Oahu Helicopter Tour
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fill out the form below and we'll handle the rest. You'll receive a confirmation with your reference code.
          </p>
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
