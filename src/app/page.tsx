import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Helicopter Tours on Oahu | Book Oahu Helicopter Tours Online',
  description:
    'Book helicopter tours on Oahu with Blue Hawaiian & Rainbow Helicopters. Compare Oahu helicopter tours, prices & doors-off options. Safe, scenic Hawaii helicopter tours—book online.',
  openGraph: {
    title: 'Helicopter Tours on Oahu | Book Oahu Helicopter Tours',
    description: 'Book Oahu helicopter tours with Blue Hawaiian & Rainbow. Compare and book online. Safe, scenic, personalized.',
    url: 'https://booking.helicoptertoursonoahu.com',
  },
  alternates: { canonical: 'https://booking.helicoptertoursonoahu.com' },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section: video background (gradient fallback until video loads) */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 min-h-[60vh] flex items-center justify-center bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src="https://www.helicoptertoursonoahu.com/video/helicopterpromo.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 via-blue-800/40 to-indigo-900/50 z-[1]" aria-hidden />
        <div className="container mx-auto max-w-4xl text-center relative z-10 text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-sm">
            Helicopter Tours on Oahu — Book Now
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Safe • Scenic • Personalized with Blue Hawaiian & Rainbow Helicopters
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10 text-base md:text-lg">
            <span className="inline-flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2" aria-hidden />
              Safe
            </span>
            <span className="text-blue-300">•</span>
            <span className="inline-flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-300 mr-2" aria-hidden />
              Scenic
            </span>
            <span className="text-blue-300">•</span>
            <span className="inline-flex items-center">
              <span className="w-2 h-2 rounded-full bg-orange-300 mr-2" aria-hidden />
              Personalized
            </span>
          </div>
          <Link
            href="/bookings"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg md:text-xl font-semibold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-blue-700"
          >
            Start Booking
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white py-8 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm md:text-base text-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Top Rated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compare Our Top Operators
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We partner with Blue Hawaiian and Rainbow Helicopters. Compare features, prices, and doors-off options below.
            </p>
          </div>

          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[320px]">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <th className="px-4 sm:px-6 py-4 text-left font-semibold text-sm sm:text-base">Feature</th>
                    <th className="px-4 sm:px-6 py-4 text-center font-semibold text-sm sm:text-base">Blue Hawaiian</th>
                    <th className="px-4 sm:px-6 py-4 text-center font-semibold text-sm sm:text-base">Rainbow Helicopters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 text-sm sm:text-base">Experience</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">Premium tours, luxury helicopters</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">Adventure-focused, doors-off options</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 text-sm sm:text-base">Tour Types</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">Oahu, Big Island, Maui, Kauai, Lanai</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">Oahu & Big Island</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 text-sm sm:text-base">Doors-Off</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">Limited</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">✓ Multiple doors-off tours</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 text-sm sm:text-base">Price Range</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">$200 – $500+</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">$200 – $400+</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 text-sm sm:text-base">Best For</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">Luxury, multi-island</td>
                    <td className="px-4 sm:px-6 py-4 text-center text-gray-700 text-sm sm:text-base">Adventure, photography</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/bookings"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Book Your Tour Now
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Fly?</h2>
          <p className="text-blue-100 text-lg mb-6 max-w-xl mx-auto">
            Choose your date, party size, and preferred operator. We&apos;ll confirm availability and send you a reference code.
          </p>
          <Link
            href="/bookings"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
          >
            Start Booking
          </Link>
        </div>
      </section>
    </div>
  );
}
