'use client';

import { useState } from 'react';

type PaymentData = {
  card_name: string;
  card_number: string;
  card_number_masked: string;
  card_expiry: string;
  card_cvc: string;
  billing_address: string;
  billing_zip: string;
};

export default function ReservationsPage() {
  const [refCode, setRefCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    refCode: string;
    message: string;
    payment: PaymentData;
    destroyAt: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    const ref = refCode.trim().toUpperCase();
    if (!/^HTO-[A-Z0-9]{6}$/.test(ref)) {
      setError('Please enter a valid confirmation number (e.g. HTO-XXXXXX).');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your vendor password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/operator-view-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refCode: ref, password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      setResult({
        refCode: data.refCode,
        message: data.message,
        payment: data.payment,
        destroyAt: data.destroyAt,
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Reservations — View Payment</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Enter the confirmation number and your vendor password to view the client&apos;s payment details. Details are viewable for 5 minutes, then permanently destroyed.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div>
              <label htmlFor="refCode" className="block text-sm font-medium text-gray-700 mb-1">Confirmation number *</label>
              <input
                type="text"
                id="refCode"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                required
                placeholder="HTO-XXXXXX"
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Vendor password *</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your vendor password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'View payment details'}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-amber-700 font-medium mb-4">{result.message}</p>
            <ul className="space-y-2 text-gray-800 border-t border-gray-200 pt-4">
              <li><strong>Name on card:</strong> {result.payment.card_name}</li>
              <li><strong>Card number:</strong> {result.payment.card_number}</li>
              <li><strong>Expiry:</strong> {result.payment.card_expiry}</li>
              <li><strong>CVC:</strong> {result.payment.card_cvc}</li>
              <li><strong>Billing address:</strong> {result.payment.billing_address || '—'}</li>
              <li><strong>ZIP:</strong> {result.payment.billing_zip || '—'}</li>
            </ul>
            <p className="text-gray-500 text-sm mt-4">
              These details will be permanently destroyed after 5 minutes. If you need them again, contact the customer directly.
            </p>
            <button
              type="button"
              onClick={() => { setResult(null); setRefCode(''); setPassword(''); setError(''); }}
              className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-md font-medium hover:bg-gray-300"
            >
              View another reservation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
