import BookingForm from '@/components/BookingForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Oahu Helicopter Tours',
  description:
    'Book your Oahu helicopter tour with Blue Hawaiian or Rainbow Helicopters. Fill out the form—we confirm availability and send your reference code. Helicopter tours on Oahu, Maui, Kauai, Big Island.',
  openGraph: {
    title: 'Book Oahu Helicopter Tours | Helicopter Tours on Oahu',
    description: 'Book Oahu helicopter tours with Blue Hawaiian & Rainbow. Compare operators and submit your booking request.',
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

        {/* Operator Comparison Section */}
        <div className="max-w-5xl mx-auto mb-12 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 sm:px-6 py-4">
            <h2 className="text-xl sm:text-2xl font-bold text-center">Compare Our Top Operators</h2>
          </div>
          <div className="overflow-x-auto px-4 sm:px-6 py-1">
            <table className="w-full min-w-[280px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 text-sm sm:text-base">Feature</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center font-semibold text-gray-900 text-sm sm:text-base">Blue Hawaiian</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center font-semibold text-gray-900 text-sm sm:text-base">Rainbow Helicopters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Experience</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">Premium tours with luxury helicopters</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">Adventure-focused with doors-off options</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-gray-50/50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Tour Types</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">Oahu, Big Island, Maui, Kauai, Lanai</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">Oahu & Big Island</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Doors-Off</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">Limited options</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">Multiple doors-off tours</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-gray-50/50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Price Range</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">$200 – $500+</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">$200 – $400+</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Best For</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">Luxury experience, multiple islands</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">Adventure seekers & photography</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <BookingForm />
      </main>
    </div>
  );
}
