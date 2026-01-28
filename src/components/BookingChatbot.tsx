'use client';

import { useState, useEffect, useRef } from 'react';
import { VAPI_PHONE_NUMBER } from '@/lib/constants';
import {
  tours,
  getUniqueIslands,
  getToursByIslandAndOperator,
  getTourById,
  calculateTotalPrice,
  type Tour,
} from '@/lib/tours';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  buttons?: { label: string; action: string }[];
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

const ISLAND_BLURBS: Record<string, string> = {
  Oahu:
    "Oahu is home to Honolulu, Waikiki, and iconic spots like Diamond Head and the North Shore. Our Oahu tours offer stunning coastline, rainforest valleys, and famous landmarks.",
  'Big Island':
    "The Big Island has active volcanoes, black sand beaches, and dramatic waterfalls. Tours from Waikoloa and Hilo showcase lava flows, rainforest, and the Kona coast.",
  Maui:
    "Maui offers the Road to Hana from the air, West Maui and Molokai waterfalls, and lush valleys. Perfect for couples and families looking for unforgettable views.",
  Kauai:
    "Kauai is the Garden Isle—waterfalls, Na Pali Coast, and Waimea Canyon. Our Kauai tours are some of the most scenic helicopter experiences in Hawaii.",
};

type Step =
  | 'intro'
  | 'island'
  | 'operator'
  | 'tour'
  | 'tour_done'
  | 'chat'
  | 'booking';

const BOOKING_FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone number', type: 'tel', required: false },
  { key: 'party_size', label: 'Party size (number of people)', type: 'number', required: true },
  { key: 'preferred_date', label: 'Preferred date (YYYY-MM-DD)', type: 'date', required: true },
  { key: 'time_window', label: 'Time preference', type: 'select', options: ['Flexible', 'Morning', 'Afternoon', 'Evening'], required: true },
  { key: 'doors_off', label: 'Interested in doors-off?', type: 'boolean', required: true },
  { key: 'hotel', label: 'Hotel or accommodation (optional)', type: 'text', required: false },
  { key: 'total_weight', label: 'Total passenger weight in lbs (all guests combined, min 100)', type: 'number', required: true },
  { key: 'special_requests', label: 'Special requests or notes (optional)', type: 'text', required: false },
] as const;

export default function BookingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<'blueHawaiian' | 'rainbow' | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [bookingFieldIndex, setBookingFieldIndex] = useState(0);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const islands = getUniqueIslands();
  const phoneDigits = VAPI_PHONE_NUMBER.replace(/\D/g, '');
  // Avoid double "1": if number already has US country code (11 digits starting with 1), use as-is; else prepend 1
  const phoneHref =
    phoneDigits.length === 11 && phoneDigits.startsWith('1')
      ? `tel:+${phoneDigits}`
      : phoneDigits.length === 10
        ? `tel:+1${phoneDigits}`
        : phoneDigits
          ? `tel:+${phoneDigits}`
          : 'tel:+17073812583';

  useEffect(() => {
    scrollToBottom();
  }, [messages, step]);

  useEffect(() => {
    if (!isOpen) {
      setStep('intro');
      setMessages([]);
      setSelectedIsland(null);
      setSelectedOperator(null);
      setSelectedTour(null);
      setBookingData({});
      setBookingFieldIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === 'intro' && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Aloha! Welcome to Helicopter Tours on Oahu. We service the island of Oahu as well as some of the other islands. Which island would you like to know more about?",
          buttons: islands.map((island) => ({ label: island, action: `island_${island}` })),
        },
      ]);
    }
  }, [isOpen, step, islands]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (role: 'user' | 'assistant', content: string, buttons?: { label: string; action: string }[]) => {
    setMessages((prev) => [...prev, { role, content, buttons }]);
  };

  const handleAction = (action: string) => {
    if (action.startsWith('island_')) {
      const island = action.replace('island_', '');
      setSelectedIsland(island);
      setSelectedOperator(null);
      setSelectedTour(null);
      const blurb = ISLAND_BLURBS[island] || `Explore ${island} from the air.`;
      addMessage('user', island);
      addMessage(
        'assistant',
        `${blurb}\n\nWould you like to know more about Rainbow Helicopters or Blue Hawaiian?`,
        [
          { label: 'Rainbow Helicopters', action: 'operator_rainbow' },
          { label: 'Blue Hawaiian', action: 'operator_blueHawaiian' },
        ]
      );
      setStep('operator');
      return;
    }

    if (action.startsWith('operator_')) {
      const op = action.replace('operator_', '') as 'rainbow' | 'blueHawaiian';
      setSelectedOperator(op);
      setSelectedTour(null);
      const operatorTours = selectedIsland ? getToursByIslandAndOperator(selectedIsland, op) : [];
      const operatorName = op === 'rainbow' ? 'Rainbow Helicopters' : 'Blue Hawaiian';
      addMessage('user', operatorName);
      if (operatorTours.length === 0) {
        addMessage('assistant', `We don't have ${operatorName} tours listed for ${selectedIsland} at the moment. Try another island or operator.`, islands.map((i) => ({ label: i, action: `island_${i}` })));
        setStep('intro');
        setSelectedIsland(null);
        return;
      }
      addMessage(
        'assistant',
        `Here are our ${operatorName} tours for ${selectedIsland}. Click a tour to learn more:`,
        operatorTours.map((t) => ({ label: t.name, action: `tour_${t.id}` }))
      );
      setStep('tour');
      return;
    }

    if (action.startsWith('tour_')) {
      const tourId = action.replace('tour_', '');
      const tour = getTourById(tourId);
      if (!tour) return;
      setSelectedTour(tour);
      const price = tour.pricePerPerson;
      const desc = tour.description || 'A memorable helicopter experience.';
      addMessage('user', tour.name);
      addMessage(
        'assistant',
        `${tour.name}\n\n${desc}\n\nDuration: ${tour.duration || '—'}\nPrice: $${price} per person${tour.doorsOff ? ' (doors-off option)' : ''}.\n\nWould you like to book this tour or chat more?`,
        [
          { label: 'Book this tour', action: 'book_tour' },
          { label: 'Chat more', action: 'chat_more' },
        ]
      );
      setStep('tour_done');
      return;
    }

    if (action === 'book_tour') {
      addMessage('user', 'Book this tour');
      setStep('booking');
      setBookingFieldIndex(0);
      setBookingData({ ...bookingData, time_window: 'Flexible', doors_off: selectedTour?.doorsOff ?? false });
      const first = BOOKING_FIELDS[0];
      addMessage('assistant', `Great choice! To book, I'll need a few details. ${first.label}:`);
      return;
    }

    if (action === 'chat_more') {
      addMessage('user', 'Chat more');
      addMessage(
        'assistant',
        "You can ask me anything about this tour, pricing, or what to expect. Type your question below. After each answer you can book, learn about another tour, switch island, or switch helicopter company.",
        [
          { label: 'Book this tour', action: 'book_tour' },
          { label: 'Learn about another tour', action: 'learn_another_tour' },
          { label: 'Switch island', action: 'switch_island' },
          { label: 'Switch helicopter company', action: 'switch_operator' },
        ]
      );
      setStep('chat');
      return;
    }

    if (action === 'learn_another_tour') {
      addMessage('user', 'Learn about another tour');
      if (selectedIsland && selectedOperator) {
        const operatorTours = getToursByIslandAndOperator(selectedIsland, selectedOperator);
        const operatorName = selectedOperator === 'rainbow' ? 'Rainbow Helicopters' : 'Blue Hawaiian';
        addMessage(
          'assistant',
          `Here are our ${operatorName} tours for ${selectedIsland} again:`,
          operatorTours.map((t) => ({ label: t.name, action: `tour_${t.id}` }))
        );
      }
      setStep('tour');
      return;
    }

    if (action === 'switch_island') {
      addMessage('user', 'Switch island');
      addMessage(
        'assistant',
        "Which island would you like to know more about?",
        islands.map((i) => ({ label: i, action: `island_${i}` }))
      );
      setSelectedIsland(null);
      setSelectedOperator(null);
      setSelectedTour(null);
      setStep('intro');
      return;
    }

    if (action === 'switch_operator') {
      addMessage('user', 'Switch helicopter company');
      addMessage(
        'assistant',
        "Would you like to know more about Rainbow Helicopters or Blue Hawaiian?",
        [
          { label: 'Rainbow Helicopters', action: 'operator_rainbow' },
          { label: 'Blue Hawaiian', action: 'operator_blueHawaiian' },
        ]
      );
      setSelectedOperator(null);
      setSelectedTour(null);
      setStep('operator');
      return;
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    if (step === 'chat') {
      addMessage('user', text);
      setInput('');
      setIsTyping(true);
      try {
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversation_history: messages.map((m) => ({ role: m.role, content: m.content })),
            user_email: bookingData.email,
            booking_data: { ...bookingData, tour_id: selectedTour?.id, operator_preference: selectedOperator },
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        addMessage(
          'assistant',
          data.response,
          [
            { label: 'Book this tour', action: 'book_tour' },
            { label: 'Chat more', action: 'chat_more' },
            { label: 'Learn about another tour', action: 'learn_another_tour' },
            { label: 'Switch island', action: 'switch_island' },
            { label: 'Switch helicopter company', action: 'switch_operator' },
          ]
        );
      } catch (err) {
        addMessage('assistant', `Sorry, I hit an error. Please try again or call us at ${VAPI_PHONE_NUMBER}.`);
      }
      setIsTyping(false);
      return;
    }

    if (step === 'booking') {
      const field = BOOKING_FIELDS[bookingFieldIndex];
      if (!field) return;

      if (field.key === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          addMessage('assistant', 'Please enter a valid email address.');
          return;
        }
      }
      if (field.key === 'preferred_date') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(text)) {
          addMessage('assistant', 'Please enter the date in YYYY-MM-DD format (e.g. 2026-02-15).');
          return;
        }
      }

      if (field.type === 'number') {
        const num = parseInt(text, 10);
        if (isNaN(num)) {
          addMessage('assistant', 'Please enter a valid number.');
          return;
        }
        if (field.key === 'total_weight' && num < 100) {
          addMessage('assistant', 'Total weight must be at least 100 lbs. Please enter the combined weight of all passengers.');
          return;
        }
        if (field.key === 'party_size' && (num < 1 || num > 20)) {
          addMessage('assistant', 'Party size must be between 1 and 20.');
          return;
        }
        setBookingData((prev) => ({ ...prev, [field.key]: num }));
      } else if (field.type === 'boolean') {
        const val = /yes|true|1|y/i.test(text);
        setBookingData((prev) => ({ ...prev, [field.key]: val }));
      } else {
        setBookingData((prev) => ({ ...prev, [field.key]: text }));
      }

      addMessage('user', text);
      setInput('');

      const nextIndex = bookingFieldIndex + 1;
      if (nextIndex >= BOOKING_FIELDS.length) {
        addMessage('assistant', "Thanks! Submitting your booking now...");
        setBookingFieldIndex(0);
        submitBookingFromChat();
        return;
      }

      const nextField = BOOKING_FIELDS[nextIndex];
      setBookingFieldIndex(nextIndex);
      addMessage('assistant', `${nextField.label}:`);
      return;
    }
  };

  const submitBookingFromChat = async () => {
    if (!selectedOperator || !selectedTour) {
      addMessage('assistant', 'Missing tour or operator. Please start over or call us.');
      return;
    }
    setIsSubmittingBooking(true);
    const email = bookingData.email || '';
    const payload = {
      name: bookingData.name || '',
      email,
      phone: bookingData.phone,
      party_size: bookingData.party_size || 2,
      preferred_date: bookingData.preferred_date || '',
      time_window: bookingData.time_window || 'Flexible',
      doors_off: bookingData.doors_off ?? false,
      hotel: bookingData.hotel,
      special_requests: bookingData.special_requests,
      total_weight: bookingData.total_weight || 300,
      source: 'chatbot',
      operator_preference: selectedOperator,
      tour_id: selectedTour.id,
      tour_name: selectedTour.name,
    };

    try {
      const res = await fetch('/api/new-booking-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      setIsSubmittingBooking(false);

      if (result.success) {
        const successData = {
          ref_code: result.ref_code,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          party_size: payload.party_size,
          preferred_date: payload.preferred_date,
          time_window: payload.time_window,
          total_weight: payload.total_weight,
          doors_off: payload.doors_off,
          hotel: payload.hotel,
          operator: selectedOperator === 'rainbow' ? 'Rainbow Helicopters' : 'Blue Hawaiian Helicopters',
          tour_name: selectedTour.name,
          total_price: calculateTotalPrice(selectedTour.id, payload.party_size),
        };
        sessionStorage.setItem('booking_success_data', JSON.stringify(successData));
        addMessage(
          'assistant',
          `Your booking request has been submitted. Your reference code is **${result.ref_code}**. You'll receive a confirmation email shortly. Redirecting to your confirmation...`
        );
        setTimeout(() => {
          window.location.href = `/bookings/success?ref_code=${result.ref_code}`;
        }, 2000);
      } else {
        throw new Error(result.error || 'Booking failed');
      }
    } catch (err) {
      setIsSubmittingBooking(false);
      addMessage('assistant', `Something went wrong submitting your booking. Please call us at ${VAPI_PHONE_NUMBER} or try again.`);
    }
  };

  const currentField = step === 'booking' ? BOOKING_FIELDS[bookingFieldIndex] : null;
  const showFooter = step === 'chat' || step === 'booking';
  const showTextInput = step === 'chat' || (step === 'booking' && currentField && ['text', 'email', 'tel', 'number', 'date'].includes(currentField.type));

  return (
    <>
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

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header with call button */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚁</span>
              <div>
                <h4 className="font-semibold text-base">Helicopter Tours on Oahu</h4>
                <p className="text-xs opacity-90">Chat & book</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={phoneHref}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Call us"
                title={`Call ${VAPI_PHONE_NUMBER}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {msg.role === 'user' ? '👤' : '🚁'}
                  </div>
                  <div>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.buttons.map((btn) => (
                          <button
                            key={btn.action}
                            onClick={() => handleAction(btn.action)}
                            className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">🚁</div>
                <div className="bg-white rounded-2xl px-3 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {isSubmittingBooking && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                Submitting your booking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {showFooter && (
            <div className="p-3 border-t border-gray-200 bg-white shrink-0">
              {step === 'booking' && currentField?.type === 'select' && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(currentField.options || []).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setBookingData((prev) => ({ ...prev, [currentField.key]: opt }));
                        addMessage('user', opt);
                        const nextIndex = bookingFieldIndex + 1;
                        if (nextIndex >= BOOKING_FIELDS.length) {
                          addMessage('assistant', "Thanks! Submitting your booking now...");
                          setBookingFieldIndex(0);
                          submitBookingFromChat();
                        } else {
                          const nextField = BOOKING_FIELDS[nextIndex];
                          setBookingFieldIndex(nextIndex);
                          addMessage('assistant', `${nextField.label}:`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium hover:bg-blue-200"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {step === 'booking' && currentField?.type === 'boolean' && (
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => {
                      setBookingData((prev) => ({ ...prev, [currentField.key]: true }));
                      addMessage('user', 'Yes');
                      const nextIndex = bookingFieldIndex + 1;
                      if (nextIndex >= BOOKING_FIELDS.length) {
                        addMessage('assistant', "Thanks! Submitting your booking now...");
                        setBookingFieldIndex(0);
                        submitBookingFromChat();
                      } else {
                        setBookingFieldIndex(nextIndex);
                        addMessage('assistant', `${BOOKING_FIELDS[nextIndex].label}:`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium hover:bg-blue-200"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => {
                      setBookingData((prev) => ({ ...prev, [currentField.key]: false }));
                      addMessage('user', 'No');
                      const nextIndex = bookingFieldIndex + 1;
                      if (nextIndex >= BOOKING_FIELDS.length) {
                        addMessage('assistant', "Thanks! Submitting your booking now...");
                        setBookingFieldIndex(0);
                        submitBookingFromChat();
                      } else {
                        setBookingFieldIndex(nextIndex);
                        addMessage('assistant', `${BOOKING_FIELDS[nextIndex].label}:`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200"
                  >
                    No
                  </button>
                </div>
              )}
              {(step === 'chat' || (step === 'booking' && currentField && !['select', 'boolean'].includes(currentField.type))) && (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type={currentField?.type === 'email' ? 'email' : currentField?.type === 'number' ? 'number' : currentField?.type === 'date' ? 'date' : 'text'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={step === 'booking' ? `Enter ${currentField?.label.toLowerCase()}` : 'Type your message...'}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping || isSubmittingBooking}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
