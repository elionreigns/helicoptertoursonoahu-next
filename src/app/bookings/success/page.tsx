'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BookingSuccessData {
  ref_code: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  party_size: number | null;
  preferred_date: string | null;
  time_window: string | null;
  total_weight: number | null;
  doors_off: boolean;
  hotel: string | null;
  operator?: string;
  tour_name?: string;
  total_price?: number;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const [bookingData, setBookingData] = useState<BookingSuccessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get ref_code from URL params first
    const refCodeFromUrl = searchParams.get('ref_code');

    // Try to get booking data from sessionStorage
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('booking_success_data');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setBookingData(parsed);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing stored booking data:', error);
        }
      }

      // If no stored data but we have ref_code from URL, create minimal data
      if (refCodeFromUrl) {
        setBookingData({
          ref_code: refCodeFromUrl,
          name: null,
          email: null,
          phone: null,
          party_size: null,
          preferred_date: null,
          time_window: null,
          total_weight: null,
          doors_off: false,
          hotel: null,
        });
      }
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!bookingData || !bookingData.ref_code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your booking information. Please contact us if you need assistance.
          </p>
          <Link
            href="https://helicoptertoursonoahu.com"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Request Submitted!</h1>
          <p className="text-lg text-gray-600">
            Your request has been sent to the operator – we'll confirm soon
          </p>
        </div>

        {/* Reference Code Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="text-sm font-medium mb-2 opacity-90">Reference Code</div>
          <div className="text-3xl font-bold tracking-wider">{bookingData.ref_code}</div>
          <p className="text-sm mt-2 opacity-90">
            Please save this code for your records. You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Summary</h2>
          
          <div className="space-y-4">
            {bookingData.name && (
              <div className="flex justify-between items-start py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-900 text-right">{bookingData.name}</span>
              </div>
            )}

            {bookingData.email && (
              <div className="flex justify-between items-start py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Email:</span>
                <span className="text-gray-900 text-right break-all">{bookingData.email}</span>
              </div>
            )}

            {bookingData.phone && (
              <div className="flex justify-between items-start py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="text-gray-900 text-right">{bookingData.phone}</span>
              </div>
            )}

            {bookingData.preferred_date && (
              <div className="flex justify-between items-start py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Preferred Date:</span>
                <span className="text-gray-900 text-right">
                  {new Date(bookingData.preferred_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {bookingData.time_window && (
              <div className="flex justify-between items-start py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Time Window:</span>
                <span className="text-gray-900 text-right capitalize">{bookingData.time_window}</span>
              </div>
            )}

            {bookingData.party_size && (
              <div className="flex justify-between items-start py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Party Size:</span>
                <span className="text-gray-900 text-right">{bookingData.party_size} {bookingData.party_size === 1 ? 'person' : 'people'}</span>
              </div>
            )}

            {bookingData.total_weight && (
              <div className="flex justify-between items-start py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Total Weight:</span>
                <span className="text-gray-900 text-right">{bookingData.total_weight} lbs</span>
              </div>
            )}

            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="font-medium text-gray-700">Doors-Off:</span>
              <span className="text-gray-900 text-right">{bookingData.doors_off ? 'Yes' : 'No'}</span>
            </div>

            {bookingData.hotel && (
              <div className="flex justify-between items-start py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Hotel:</span>
                <span className="text-gray-900 text-right">{bookingData.hotel}</span>
              </div>
            )}

            {(bookingData.operator || bookingData.tour_name != null || bookingData.total_price != null) && (
              <>
                {bookingData.operator && (
                  <div className="flex justify-between items-start py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Operator:</span>
                    <span className="text-gray-900 text-right">{bookingData.operator}</span>
                  </div>
                )}
                {bookingData.tour_name && (
                  <div className="flex justify-between items-start py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Tour:</span>
                    <span className="text-gray-900 text-right">{bookingData.tour_name}</span>
                  </div>
                )}
                {bookingData.total_price != null && bookingData.total_price > 0 && (
                  <div className="flex justify-between items-start py-3">
                    <span className="font-medium text-gray-700">Total Price:</span>
                    <span className="text-gray-900 text-right font-semibold">${bookingData.total_price.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>You'll receive a confirmation email at {bookingData.email || 'your email address'} within 24 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Our team will contact you to confirm availability and finalize your booking</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Keep your reference code ({bookingData.ref_code}) handy for any inquiries</span>
            </li>
          </ul>
        </div>

        {/* Return Home Button */}
        <div className="text-center">
          <Link
            href="https://helicoptertoursonoahu.com"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function SuccessFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <BookingSuccessContent />
    </Suspense>
  );
}
