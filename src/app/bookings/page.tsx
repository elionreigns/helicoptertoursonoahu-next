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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4">
            <h2 className="text-2xl font-bold text-center">Compare Our Top Operators</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900">Blue Hawaiian</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900">Rainbow Helicopters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Experience</td>
                  <td className="px-6 py-4 text-center text-gray-700">Premium tours with luxury helicopters</td>
                  <td className="px-6 py-4 text-center text-gray-700">Adventure-focused with doors-off options</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Tour Types</td>
                  <td className="px-6 py-4 text-center text-gray-700">Oahu, Big Island, Maui, Kauai, Lanai</td>
                  <td className="px-6 py-4 text-center text-gray-700">Oahu & Big Island tours</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Doors-Off</td>
                  <td className="px-6 py-4 text-center text-gray-700">Limited options</td>
                  <td className="px-6 py-4 text-center text-gray-700">✓ Multiple doors-off tours</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Price Range</td>
                  <td className="px-6 py-4 text-center text-gray-700">$200 - $500+</td>
                  <td className="px-6 py-4 text-center text-gray-700">$200 - $400+</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Best For</td>
                  <td className="px-6 py-4 text-center text-gray-700">Luxury experience, multiple islands</td>
                  <td className="px-6 py-4 text-center text-gray-700">Adventure seekers, photography</td>
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
