'use client';

import { useState } from 'react';

export default function AdminTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const testBooking = async () => {
    setIsLoading(true);
    setResponse(null);
    setError(null);
    setLogs([]);

    addLog('Starting test booking request...');

    // Generate test data
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '(808) 555-1234',
      party_size: 2,
      preferred_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      time_window: 'morning',
      doors_off: false,
      hotel: 'Test Hotel',
      special_requests: 'This is a test booking from admin panel',
      total_weight: 350,
      source: 'web',
    };

    addLog(`Test data prepared: ${JSON.stringify(testData, null, 2)}`);

    try {
      addLog('Sending POST request to /api/new-booking-request...');
      
      const res = await fetch('/api/new-booking-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      addLog(`Response status: ${res.status} ${res.statusText}`);

      const data = await res.json();
      
      if (res.ok) {
        addLog('✅ Request successful!');
        addLog(`Response: ${JSON.stringify(data, null, 2)}`);
        setResponse(data);
      } else {
        addLog(`❌ Request failed: ${data.error || 'Unknown error'}`);
        setError(data.error || 'Request failed');
        setResponse(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`❌ Exception occurred: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      addLog('Test completed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Test Page</h1>
            <p className="text-gray-600">
              Test the booking API endpoint with dummy data. This will:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
              <li>Create a test booking in Supabase</li>
              <li>Generate a reference code</li>
              <li>Trigger the n8n webhook (if configured)</li>
              <li>Return the booking response</li>
            </ul>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Warning:</strong> This will create a real booking record in the database. 
              Use only for testing purposes.
            </p>
          </div>

          <button
            onClick={testBooking}
            disabled={isLoading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isLoading ? 'Testing...' : 'Test Booking Request'}
          </button>

          {/* Response Section */}
          {response && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Response</h2>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error Section */}
          {error && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-red-900 mb-3">Error</h2>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Logs Section */}
          {logs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Logs</h2>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm text-green-400 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Test Data Preview */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Test Data That Will Be Sent:</h3>
            <div className="bg-white rounded p-3 text-sm">
              <pre className="text-gray-700 overflow-x-auto">
                {JSON.stringify({
                  name: 'Test User',
                  email: 'test@example.com',
                  phone: '(808) 555-1234',
                  party_size: 2,
                  preferred_date: '7 days from today',
                  time_window: 'morning',
                  doors_off: false,
                  hotel: 'Test Hotel',
                  special_requests: 'This is a test booking',
                  total_weight: 350,
                  source: 'web',
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
