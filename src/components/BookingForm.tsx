'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { tours, getToursByOperator, calculateTotalPrice, type Tour } from '@/lib/tours';

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  operator_preference: 'blueHawaiian' | 'rainbow' | '';
  tour_name: string;
  party_size: number;
  preferred_date: string;
  time_window: string;
  doors_off: boolean;
  hotel: string;
  special_requests: string;
  total_weight: number;
  // Optional payment fields
  card_name?: string;
  card_number?: string;
  card_expiry?: string; // MM/YY format
  card_cvc?: string;
  billing_address?: string;
  billing_zip?: string;
}

export default function BookingForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    operator_preference: '',
    tour_name: '',
    party_size: 2,
    preferred_date: '',
    time_window: '',
    doors_off: false,
    hotel: '',
    special_requests: '',
    total_weight: 300,
    card_name: '',
    card_number: '',
    card_expiry: '',
    card_cvc: '',
    billing_address: '',
    billing_zip: '',
  });

  // Get available tours based on selected operator
  const availableTours = useMemo(() => {
    if (!formData.operator_preference) return [];
    return getToursByOperator(formData.operator_preference);
  }, [formData.operator_preference]);

  // Get selected tour for price calculation
  const selectedTour = useMemo(() => {
    if (!formData.tour_name) return null;
    return tours.find(t => t.id === formData.tour_name);
  }, [formData.tour_name]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedTour) return 0;
    return calculateTotalPrice(selectedTour.id, formData.party_size);
  }, [selectedTour, formData.party_size]);

  const [showPayment, setShowPayment] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    ref_code?: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.party_size < 1 || formData.party_size > 20) {
      newErrors.party_size = 'Party size must be between 1 and 20';
    }

    if (!formData.preferred_date) {
      newErrors.preferred_date = 'Preferred date is required';
    } else {
      const selectedDate = new Date(formData.preferred_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.preferred_date = 'Date cannot be in the past';
      }
    }

    if (!formData.total_weight || formData.total_weight < 100) {
      newErrors.total_weight = 'Total weight must be at least 100 lbs';
    }

    if (!formData.operator_preference) {
      newErrors.operator_preference = 'Please select an operator';
    }

    if (!formData.tour_name) {
      newErrors.tour_name = 'Please select a tour';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitResult(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/new-booking-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          operator_preference: formData.operator_preference as 'blueHawaiian' | 'rainbow',
          tour_name: selectedTour?.name || formData.tour_name,
          tour_id: selectedTour?.id || formData.tour_name, // Send tour ID for pricing lookup
          party_size: formData.party_size,
          preferred_date: formData.preferred_date,
          time_window: formData.time_window,
          doors_off: formData.doors_off,
          hotel: formData.hotel,
          special_requests: formData.special_requests,
          total_weight: formData.total_weight,
          source: 'web',
          // Include payment only if provided
          ...(showPayment && formData.card_name && formData.card_number && {
            payment: {
              card_name: formData.card_name,
              card_number: formData.card_number,
              card_expiry: formData.card_expiry,
              card_cvc: formData.card_cvc,
              billing_address: formData.billing_address,
              billing_zip: formData.billing_zip,
            },
          }),
        }),
      });

      const result = await response.json();

      if (result.success) {
        const operatorDisplayName =
          formData.operator_preference === 'blueHawaiian'
            ? 'Blue Hawaiian Helicopters'
            : formData.operator_preference === 'rainbow'
            ? 'Rainbow Helicopters'
            : '';
        // Store booking data in sessionStorage for success page
        sessionStorage.setItem('booking_success_data', JSON.stringify({
          ref_code: result.ref_code,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          party_size: formData.party_size,
          preferred_date: formData.preferred_date,
          time_window: formData.time_window,
          total_weight: formData.total_weight,
          doors_off: formData.doors_off,
          hotel: formData.hotel,
          operator: operatorDisplayName,
          tour_name: selectedTour?.name || formData.tour_name || '',
          total_price: totalPrice,
        }));
        
        // Redirect to success page
        router.push(`/bookings/success?ref_code=${result.ref_code}`);
      } else {
        const msg = result.error || 'Failed to submit booking request. Please try again.';
        const detail = result.details ? ` — ${result.details}` : '';
        setSubmitResult({
          success: false,
          message: msg + detail,
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitResult({
        success: false,
        message: 'An error occurred. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
          ? parseInt(value) || 0
          : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-white rounded-xl shadow-xl border border-gray-100">
      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">Book Your Helicopter Tour</h2>
      <p className="text-gray-600 mb-6">Fill out the form below and we'll handle the rest</p>

      {submitResult && (
        <div
          role="alert"
          className={`mb-6 p-4 rounded ${
            submitResult.success
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {submitResult.success && submitResult.ref_code && (
            <p className="font-semibold mb-2">Reference Code: {submitResult.ref_code}</p>
          )}
          <p>{submitResult.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              aria-required="true"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email * <span className="text-gray-500 font-normal">(your contact for this booking)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(808) 555-1234"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-1">
              Party Size *
            </label>
            <input
              type="number"
              id="party_size"
              name="party_size"
              required
              aria-required="true"
              aria-invalid={errors.party_size ? 'true' : 'false'}
              aria-describedby={errors.party_size ? 'party_size-error' : undefined}
              min="1"
              max="20"
              value={formData.party_size}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.party_size ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.party_size && (
              <p id="party_size-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.party_size}
              </p>
            )}
          </div>
        </div>

        {/* Operator and Tour Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="operator_preference" className="block text-sm font-medium text-gray-700 mb-1">
              Operator *
            </label>
            <select
              id="operator_preference"
              name="operator_preference"
              required
              aria-required="true"
              aria-invalid={errors.operator_preference ? 'true' : 'false'}
              aria-describedby={errors.operator_preference ? 'operator_preference-error' : undefined}
              value={formData.operator_preference}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, operator_preference: e.target.value as 'blueHawaiian' | 'rainbow' | '', tour_name: '' }));
              }}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.operator_preference ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Operator</option>
              <option value="blueHawaiian">Blue Hawaiian Helicopters</option>
              <option value="rainbow">Rainbow Helicopters</option>
            </select>
            {errors.operator_preference && (
              <p id="operator_preference-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.operator_preference}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="tour_name" className="block text-sm font-medium text-gray-700 mb-1">
              Tour *
            </label>
            <select
              id="tour_name"
              name="tour_name"
              required
              aria-required="true"
              disabled={!formData.operator_preference}
              aria-invalid={errors.tour_name ? 'true' : 'false'}
              aria-describedby={errors.tour_name ? 'tour_name-error' : undefined}
              value={formData.tour_name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.tour_name ? 'border-red-300' : 'border-gray-300'
              } ${!formData.operator_preference ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">{formData.operator_preference ? 'Select Tour' : 'Select Operator First'}</option>
              {availableTours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.name} - ${tour.pricePerPerson}/person
                </option>
              ))}
            </select>
            {errors.tour_name && (
              <p id="tour_name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.tour_name}
              </p>
            )}
          </div>
        </div>

        {/* Price Display */}
        {selectedTour && totalPrice > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Tour: <span className="font-medium text-gray-900">{selectedTour.name}</span></p>
                <p className="text-sm text-gray-600">
                  {formData.party_size} {formData.party_size === 1 ? 'person' : 'people'} × ${selectedTour.pricePerPerson}/person
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">${totalPrice.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Price</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="preferred_date" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              id="preferred_date"
              name="preferred_date"
              required
              aria-required="true"
              aria-invalid={errors.preferred_date ? 'true' : 'false'}
              aria-describedby={errors.preferred_date ? 'preferred_date-error' : undefined}
              value={formData.preferred_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.preferred_date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.preferred_date && (
              <p id="preferred_date-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.preferred_date}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="time_window" className="block text-sm font-medium text-gray-700 mb-1">
              Time Preference
            </label>
            <select
              id="time_window"
              name="time_window"
              value={formData.time_window}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Flexible</option>
              <option value="morning">Morning (8am - 12pm)</option>
              <option value="afternoon">Afternoon (12pm - 5pm)</option>
              <option value="evening">Evening (5pm - 8pm)</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="hotel" className="block text-sm font-medium text-gray-700 mb-1">
            Hotel/Accommodation
          </label>
          <input
            type="text"
            id="hotel"
            name="hotel"
            value={formData.hotel}
            onChange={handleChange}
            placeholder="Where are you staying?"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="total_weight" className="block text-sm font-medium text-gray-700 mb-1">
            Total Passenger Weight (lbs) *
          </label>
          <input
            type="number"
            id="total_weight"
            name="total_weight"
            required
            aria-required="true"
            aria-invalid={errors.total_weight ? 'true' : 'false'}
            aria-describedby={errors.total_weight ? 'total_weight-error' : undefined}
            min="100"
            step="10"
            value={formData.total_weight}
            onChange={handleChange}
            placeholder="e.g., 300"
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.total_weight ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Combined weight of all passengers. Minimum 100 lbs required for safety.
          </p>
          {errors.total_weight && (
            <p id="total_weight-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.total_weight}
            </p>
          )}
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="doors_off"
            name="doors_off"
            checked={formData.doors_off}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="doors_off" className="ml-2 block text-sm text-gray-700">
            I'm interested in a doors-off tour
          </label>
        </div>

        <div>
          <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-1">
            Special Requests or Notes
          </label>
          <textarea
            id="special_requests"
            name="special_requests"
            rows={4}
            value={formData.special_requests}
            onChange={handleChange}
            placeholder="Any special requests or additional information..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Optional Payment Information */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Information (Optional)</h3>
            <button
              type="button"
              onClick={() => setShowPayment(!showPayment)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showPayment ? 'Hide' : 'Add Payment Info'}
            </button>
          </div>

          {showPayment && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Security Notice:</p>
                    <p>For security, never share your CVC over the phone. We'll send you a secure email link or forward your payment details directly to the operator for processing. Your full card number and CVC are never stored in our system.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="card_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name on Card *
                  </label>
                  <input
                    type="text"
                    id="card_name"
                    name="card_name"
                    value={formData.card_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    id="card_number"
                    name="card_number"
                    value={formData.card_number}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="card_expiry" className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry (MM/YY) *
                    </label>
                    <input
                      type="text"
                      id="card_expiry"
                      name="card_expiry"
                      value={formData.card_expiry}
                      onChange={handleChange}
                      placeholder="12/25"
                      maxLength={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="card_cvc" className="block text-sm font-medium text-gray-700 mb-1">
                      CVC *
                    </label>
                    <input
                      type="text"
                      id="card_cvc"
                      name="card_cvc"
                      value={formData.card_cvc}
                      onChange={handleChange}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="billing_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    id="billing_address"
                    name="billing_address"
                    value={formData.billing_address}
                    onChange={handleChange}
                    placeholder="123 Main St, City, State"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="billing_zip" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="billing_zip"
                    name="billing_zip"
                    value={formData.billing_zip}
                    onChange={handleChange}
                    placeholder="12345"
                    maxLength={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Booking Request'
          )}
        </button>
      </form>
    </div>
  );
}
