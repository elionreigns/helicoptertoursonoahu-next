'use client';

import { useState } from 'react';

export default function TestOperatorReply() {
  const [refCode, setRefCode] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [fromEmail, setFromEmail] = useState('coralcrowntechnologies@gmail.com');
  const [subject, setSubject] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/operator-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refCode: refCode || undefined,
          emailContent,
          fromEmail,
          subject: subject || undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Test Operator Reply</h1>
        <p className="text-gray-600 mb-6">
          Use this page to test operator email replies. Paste the email content from the operator's reply.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Code (optional - will be extracted from email if not provided)
            </label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="HTO-BYXUNT"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Email (Operator Email)
            </label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject (optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Re: New Helicopter Tour Booking Request - HTO-BYXUNT"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Content (Operator's Reply)
            </label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={10}
              placeholder="Paste the operator's email reply here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-semibold mb-2">Test Examples:</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li><strong>Confirmation:</strong> "Confirmed! Booking #12345. Tour at 8:00 AM on 2026-01-30."</li>
              <li><strong>Will Handle:</strong> "We'll contact the customer directly to confirm."</li>
              <li><strong>Rejection:</strong> "Not available on that date. Available: 2026-02-01, 2026-02-02"</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !emailContent}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Test Operator Reply'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className="font-semibold mb-2">
              {result.success ? '✅ Success' : '❌ Error'}
            </h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
