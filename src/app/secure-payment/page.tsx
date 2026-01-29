'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function SecurePaymentForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') ?? '';
  const token = searchParams.get('token') ?? '';
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    card_name: '',
    card_number: '',
    card_expiry: '',
    card_cvc: '',
    billing_address: '',
    billing_zip: '',
  });

  if (!refCode || !token) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow text-center">
        <p className="text-red-600 font-medium">Invalid or expired link.</p>
        <p className="text-gray-600 mt-2 text-sm">Please use the link from your confirmation email.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/secure-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refCode,
          token,
          card_name: formData.card_name,
          card_number: formData.card_number.replace(/\s/g, ''),
          card_expiry: formData.card_expiry,
          card_cvc: formData.card_cvc,
          billing_address: formData.billing_address || undefined,
          billing_zip: formData.billing_zip || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow text-center">
        <p className="text-green-700 font-medium">Thank you. Your payment details have been received securely.</p>
        <p className="text-gray-600 mt-2 text-sm">We&apos;ll use them when your tour time is confirmed. You can close this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Secure Payment Details</h1>
        <p className="text-sm text-gray-600 mb-6">
          Reference: <strong>{refCode}</strong>. Your full card number and CVC are never stored in our system or sent by email.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="card_name" className="block text-sm font-medium text-gray-700 mb-1">Name on Card *</label>
            <input
              type="text"
              id="card_name"
              name="card_name"
              value={formData.card_name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
            <input
              type="text"
              id="card_number"
              name="card_number"
              value={formData.card_number}
              onChange={handleChange}
              required
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="card_expiry" className="block text-sm font-medium text-gray-700 mb-1">Expiry (MM/YY) *</label>
              <input
                type="text"
                id="card_expiry"
                name="card_expiry"
                value={formData.card_expiry}
                onChange={handleChange}
                required
                placeholder="12/25"
                maxLength={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="card_cvc" className="block text-sm font-medium text-gray-700 mb-1">CVC *</label>
              <input
                type="text"
                id="card_cvc"
                name="card_cvc"
                value={formData.card_cvc}
                onChange={handleChange}
                required
                placeholder="123"
                maxLength={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="billing_address" className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
            <input
              type="text"
              id="billing_address"
              name="billing_address"
              value={formData.billing_address}
              onChange={handleChange}
              placeholder="123 Main St, City, State"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="billing_zip" className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              id="billing_zip"
              name="billing_zip"
              value={formData.billing_zip}
              onChange={handleChange}
              placeholder="12345"
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit securely'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SecurePaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SecurePaymentForm />
    </Suspense>
  );
}
