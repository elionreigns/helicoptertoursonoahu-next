import Link from 'next/link';
import type { Metadata } from 'next';
import { BookButton, TourCards, TrustLine } from '@/components/BookingCTAs';
import { CUSTOMER_PHONE_DISPLAY } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Private Oahu Helicopter Tours | Book 18, 30 or 60-Min Flights',
  description:
    'Private Oahu helicopter tours from Honolulu: your party flies alone. Pick 18, 30 or 60 minutes, see live dates and prices, and book online. Shared Blue Hawaiian requests also available.',
  openGraph: {
    title: 'Private Oahu Helicopter Tours | Book 18, 30 or 60-Min Flights',
    description: `Private Oahu helicopter flights from Honolulu. Book online or call ${CUSTOMER_PHONE_DISPLAY}.`,
    url: 'https://booking.helicoptertoursonoahu.com',
  },
  alternates: { canonical: 'https://booking.helicoptertoursonoahu.com' },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section: lightweight purple/gold gradient (heavy AI promo video removed per audit; swap in real operator footage when available) */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 min-h-[60vh] flex items-center justify-center bg-[#1A0B2E]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(243,210,122,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(124,58,237,0.35),transparent_60%)]" aria-hidden />
        <div className="container mx-auto max-w-4xl text-center relative z-10 text-white">
          <p className="mb-4 inline-block rounded-full border border-[#F3D27A]/50 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#F3D27A]">Private flights · Honolulu, Oʻahu</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight !text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]">
            Private Oahu Helicopter Tours
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl mx-auto">
            Your party flies alone · 18, 30 or 60 minutes · Live dates &amp; prices
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <BookButton tour={null} cta="private-hero-primary" className="text-lg !px-9">Book Your Private Flight</BookButton>
            <a href="#tours" className="inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-white/40 px-7 py-3 font-semibold text-white transition hover:border-[#F3D27A] hover:bg-white/10 active:scale-[0.97]">
              Compare 18 / 30 / 60 min
            </a>
          </div>
          <TrustLine />
        </div>
      </section>

      <TourCards />

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

      {/* Blue Hawaiian highlights */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Blue Hawaiian Helicopters — at a glance
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We currently feature Blue Hawaiian for new bookings on this site. Scenic Eco-Star flights across Oahu and neighbor islands.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto px-4 sm:px-6 py-1">
              <table className="w-full min-w-[280px]">
                <thead>
                  <tr className="bg-[#0B1F33] text-white">
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm sm:text-base">Feature</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-sm sm:text-base">Blue Hawaiian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Experience</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 text-sm sm:text-base">Premium tours with luxury Eco-Star helicopters and large windows for views and photos</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Islands</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 text-sm sm:text-base">Oʻahu, Maui, Kauaʻi, Big Island, Lānaʻi</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Typical price band</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 text-sm sm:text-base">From about $200–$500+ per person depending on tour length and island (confirm at booking)</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">Best for</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 text-sm sm:text-base">Comfort, multi-island itineraries, and resort-friendly check-in locations</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/bookings"
              className="inline-flex min-h-[48px] items-center rounded-full border-2 border-[#2A1240] px-8 py-3 font-semibold text-[#2A1240] transition-all hover:bg-[#2A1240] hover:text-white active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7C3AED]/40"
            >
              Request a shared Blue Hawaiian tour →
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-[#2A1240] to-[#1A0B2E] text-white py-14 md:py-20 pb-28 md:pb-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 !text-white">Ready to fly?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Pick your date and party size in the live calendar. Private flights confirm instantly.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <BookButton tour={null} cta="private-bottom-primary" className="text-lg !px-10">Book Private Helicopter Tour</BookButton>
            <Link href="/bookings" className="inline-flex min-h-[52px] items-center rounded-full border-2 border-white/40 px-7 py-3 font-semibold text-white transition hover:border-[#F3D27A] hover:bg-white/10 active:scale-[0.97]">
              Shared Blue Hawaiian request
            </Link>
          </div>
          <TrustLine />
        </div>
      </section>
    </main>
  );
}
