'use client';

import { useState } from 'react';
import { VAPI_PHONE_NUMBER } from '@/lib/constants';

export default function VapiTestPage() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestWebhook = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Simulate a VAPI webhook event with sample transcript
      const testPayload = {
        message: {
          type: 'end-of-call-report',
          transcript: `Agent: Hello! Thank you for calling Helicopter Tours on Oahu. How can I help you today?
Customer: Hi, I'd like to book a helicopter tour.
Agent: Great! I'd be happy to help you with that. May I have your name?
Customer: My name is John Doe.
Agent: Thank you, John. What's your email address?
Customer: john.doe@example.com
Agent: Perfect. And your phone number?
Customer: 808-555-1234
Agent: How many people will be in your party?
Customer: 2 people
Agent: What's your preferred date?
Customer: February 15th, 2026
Agent: What time of day would you prefer?
Customer: Morning would be great
Agent: Would you like doors-off or doors-on?
Customer: Doors-off please
Agent: Where are you staying?
Customer: Hilton Hawaiian Village
Agent: What's the total weight of all passengers?
Customer: 320 pounds
Agent: Any special requests?
Customer: Window seats if possible
Agent: Perfect! I have all your information. Your reference code is HTO-TEST01. You'll receive a confirmation email shortly. Thank you for calling!`,
          call: {
            id: 'test-call-123',
            customer: {
              number: '+18085551234',
            },
            assistantId: 'a12de0b2-fe4d-4806-b468-d9052ac9ca6d',
            status: 'ended',
            endedReason: 'completed',
            duration: 180,
            cost: 0.15,
          },
        },
      };

      const response = await fetch('/api/vapi-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">VAPI Phone Agent Test</h1>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Test the Phone Agent</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Call the VAPI phone number: <strong className="text-blue-600">{VAPI_PHONE_NUMBER}</strong></li>
              <li>The AI agent will answer and collect your booking information</li>
              <li>Provide the following test information:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Name: Your name</li>
                  <li>Email: {process.env.NEXT_PUBLIC_TEST_EMAIL || 'test@example.com'}</li>
                  <li>Phone: Your phone number</li>
                  <li>Party Size: 2 people</li>
                  <li>Preferred Date: Any future date (YYYY-MM-DD format)</li>
                  <li>Time Window: morning, afternoon, evening, or flexible</li>
                  <li>Doors-off: yes or no</li>
                  <li>Hotel: Any hotel name</li>
                  <li>Total Weight: At least 100 lbs (e.g., 320 lbs)</li>
                </ul>
              </li>
              <li>After the call ends, check:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Supabase bookings table for your booking</li>
                  <li>Your email for confirmation (if email was provided)</li>
                  <li>Vercel logs for webhook processing</li>
                </ul>
              </li>
            </ol>
          </div>

          {/* Webhook Test */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Webhook Endpoint</h2>
            <p className="text-gray-600 mb-4">
              Click the button below to simulate a VAPI webhook call with sample transcript data.
            </p>
            <button
              onClick={handleTestWebhook}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Testing...' : 'Test Webhook with Sample Data'}
            </button>

            {testResult && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Result:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {testResult}
                </pre>
              </div>
            )}
          </div>

          {/* Configuration Info */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>VAPI Assistant ID:</strong>{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded">a12de0b2-fe4d-4806-b468-d9052ac9ca6d</code>
                </li>
                <li>
                  <strong>Webhook URL:</strong>{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded">
                    https://booking.helicoptertoursonoahu.com/api/vapi-webhook
                  </code>
                </li>
                <li>
                  <strong>Phone Number:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{VAPI_PHONE_NUMBER}</code>
                </li>
              </ul>
            </div>
          </div>

          {/* VAPI Setup Instructions */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">VAPI Setup Instructions</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Important:</strong> Make sure the VAPI assistant is configured with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Webhook URL pointing to: <code className="bg-yellow-100 px-1 rounded">/api/vapi-webhook</code></li>
                <li>System prompt from <code className="bg-yellow-100 px-1 rounded">vapi.md</code> file</li>
                <li>VAPI_API_KEY set in Vercel environment variables</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
