'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BookingData {
  name?: string;
  email?: string;
  phone?: string;
  party_size?: number;
  preferred_date?: string;
  time_window?: string;
  doors_off?: boolean;
  hotel?: string;
  special_requests?: string;
  total_weight?: number;
}

export default function BookingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Aloha! 👋 I\'m here to help you book your helicopter tour. Please enter your email address to get started.' }
  ]);
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      resetTimeout();
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (email) {
        addMessage('assistant', `I notice you haven't responded in a while. If you'd like, I can email you directly at ${email} with booking information. Would you like me to do that, or would you prefer to continue chatting?`);
      } else {
        addMessage('assistant', 'I notice you haven\'t responded in a while. Would you like to continue, or would you prefer to call us at (808) 994-9034?');
      }
    }, TIMEOUT_MS);
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  const handleEmailSubmit = () => {
    if (!email || !isValidEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }
    setShowEmailInput(false);
    setBookingData(prev => ({ ...prev, email }));
    addMessage('assistant', `Great! I have your email: ${email}. Now, how can I help you book your helicopter tour?`);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (showEmailInput) {
      alert('Please enter your email first');
      return;
    }

    const userMessage = input;
    addMessage('user', userMessage);
    setInput('');
    setIsTyping(true);
    resetTimeout();

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation_history: messages,
          user_email: email,
          booking_data: bookingData,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setIsTyping(false);

      if (data.booking_ready) {
        addMessage('assistant', data.response);
        setIsProcessingBooking(true);
        // Small delay to show the message before processing
        setTimeout(async () => {
          await submitBooking(data.booking_data || bookingData);
        }, 1000);
      } else {
        addMessage('assistant', data.response);
        if (data.booking_data) {
          setBookingData(prev => ({ ...prev, ...data.booking_data }));
        }
      }
    } catch (error) {
      setIsTyping(false);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again or call us at (808) 994-9034 for immediate assistance.');
      console.error('Chatbot error:', error);
    }
  };

  const submitBooking = async (data: BookingData) => {
    try {
      const response = await fetch('/api/new-booking-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name || '',
          email: data.email || email,
          phone: data.phone,
          party_size: data.party_size || 2,
          preferred_date: data.preferred_date || '',
          time_window: data.time_window,
          doors_off: data.doors_off || false,
          hotel: data.hotel,
          special_requests: data.special_requests,
          total_weight: data.total_weight || 300,
          source: 'chatbot',
        }),
      });

      const result = await response.json();

      setIsProcessingBooking(false);

      if (result.success) {
        // Store booking data for success page
        const successData = {
          ref_code: result.ref_code,
          name: data.name || '',
          email: data.email || email,
          phone: data.phone,
          party_size: data.party_size || 2,
          preferred_date: data.preferred_date || '',
          time_window: data.time_window,
          total_weight: data.total_weight || 300,
          doors_off: data.doors_off || false,
          hotel: data.hotel,
        };
        sessionStorage.setItem('booking_success_data', JSON.stringify(successData));
        
        addMessage('assistant', `✅ Great news! Your booking request has been submitted successfully. Your reference code is: **${result.ref_code}**. Redirecting you to your booking confirmation...`);
        
        // Reset booking data but keep email
        setBookingData({ email });
        
        // Redirect to success page after a short delay
        setTimeout(() => {
          window.location.href = `/bookings/success?ref_code=${result.ref_code}`;
        }, 2000);
      } else {
        throw new Error(result.error || 'Booking submission failed');
      }
    } catch (error) {
      setIsProcessingBooking(false);
      addMessage('assistant', 'I encountered an error submitting your booking. Please call us at (808) 994-9034 or try again later.');
      console.error('Booking submission error:', error);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-1 hover:scale-110"
          aria-label="Open booking chat"
        >
          <span className="text-2xl">💬</span>
          <span className="text-xs font-semibold">Chat</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚁</span>
              <div>
                <h4 className="font-semibold text-lg">Book Your Tour</h4>
                <p className="text-xs opacity-90">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {msg.role === 'user' ? '👤' : '🚁'}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  🚁
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      Gathering live data and contacting the booking department for real-time information...
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {isProcessingBooking && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm text-gray-700">
                Submitting your booking request...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            {showEmailInput ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="Enter your email to start chatting..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleEmailSubmit}
                  className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  →
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
