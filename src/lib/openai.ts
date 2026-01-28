import 'server-only';
import OpenAI from 'openai';
import { emails } from './constants';

/**
 * OpenAI client for parsing emails and spam detection
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Spam detection: Classify incoming emails to bookings@ as spam or real booking inquiry
 * 
 * IMPORTANT: Uses emails.bookingsHub from constants.ts - do NOT hard-code email addresses here.
 * To change the bookings hub email, update /lib/constants.ts
 */
export async function detectSpam(emailContent: string, fromEmail?: string, subject?: string): Promise<{
  isSpam: boolean;
  confidence: number; // 0-1
  reason?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a spam detection system for a helicopter tour booking email inbox (${emails.bookingsHub}).

Classify emails as SPAM if they are:
- Promotional/marketing emails
- Unrelated to helicopter tours or travel
- Scams or phishing attempts
- Automated newsletters
- Generic inquiries with no booking intent

Classify as REAL if they are:
- Booking inquiries or requests
- Questions about tours, pricing, availability
- Customer service requests
- Follow-ups on existing bookings
- Legitimate travel-related inquiries

Return JSON only:
{
  "isSpam": boolean,
  "confidence": number (0-1, how confident you are),
  "reason": string (brief explanation)
}`,
        },
        {
          role: 'user',
          content: `From: ${fromEmail || 'unknown'}
Subject: ${subject || 'no subject'}
Content: ${emailContent}

Is this spam or a real booking inquiry?`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more consistent spam detection
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      isSpam: result.isSpam || false,
      confidence: result.confidence || 0.5,
      reason: result.reason,
    };
  } catch (error) {
    console.error('Spam detection error:', error);
    // Default to not spam if we can't analyze (safer to process than reject)
    return {
      isSpam: false,
      confidence: 0.5,
      reason: 'analysis_failed',
    };
  }
}

/**
 * Analyze email content to detect spam or extract booking intent
 */
export async function analyzeEmail(content: string, fromEmail?: string, subject?: string): Promise<{
  isSpam: boolean;
  isBookingRequest: boolean;
  intent?: string;
  extractedData?: {
    name?: string;
    email?: string;
    phone?: string;
    partySize?: number;
    preferredDate?: string;
    timeWindow?: string;
    doorsOff?: boolean;
    hotel?: string;
    specialRequests?: string;
  };
}> {
  try {
    // First check for spam
    const spamCheck = await detectSpam(content, fromEmail, subject);
    if (spamCheck.isSpam && spamCheck.confidence > 0.7) {
      return {
        isSpam: true,
        isBookingRequest: false,
        intent: 'spam',
      };
    }

    // Then analyze for booking intent
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an email analysis assistant for a helicopter tour booking system. Analyze emails and:
1. Determine if it's a booking request (isBookingRequest: true)
2. Extract booking information if present: name, email, phone, party_size, preferred_date, time_window, doors_off preference, hotel, special_requests

Return JSON only with this structure:
{
  "isBookingRequest": boolean,
  "intent": string (brief description),
  "extractedData": {
    "name": string | null,
    "email": string | null,
    "phone": string | null,
    "partySize": number | null,
    "preferredDate": string | null (YYYY-MM-DD format),
    "timeWindow": string | null,
    "doorsOff": boolean | null,
    "hotel": string | null,
    "specialRequests": string | null
  }
}`,
        },
        {
          role: 'user',
          content: `Analyze this email:\n\n${content}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      isSpam: spamCheck.isSpam,
      isBookingRequest: result.isBookingRequest || false,
      intent: result.intent || spamCheck.reason,
      extractedData: result.extractedData,
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    // Default to not spam, but not a booking request if we can't analyze
    return {
      isSpam: false,
      isBookingRequest: false,
      intent: 'analysis_failed',
    };
  }
}

/**
 * Parse operator reply to extract booking confirmation details
 */
export async function parseOperatorReply(content: string): Promise<{
  isConfirmation: boolean;
  isRejection: boolean;
  willHandleDirectly: boolean; // Operator says they'll contact customer directly
  confirmationNumber?: string;
  availableDates?: string[];
  price?: number;
  notes?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are parsing operator replies for helicopter tour bookings. Extract:
1. Is this a confirmation? (isConfirmation: boolean) - operator confirms booking is set
2. Is this a rejection? (isRejection: boolean) - operator says not available
3. Will operator handle directly? (willHandleDirectly: boolean) - operator says "we'll contact them", "we'll handle it", "we'll reach out", etc.
4. Confirmation number if present
5. Available dates mentioned
6. Price quoted
7. Any notes or special instructions

Examples:
- "Confirmed! Booking #12345" → isConfirmation: true
- "We'll contact the customer directly" → willHandleDirectly: true
- "Not available on that date" → isRejection: true

Return JSON only:
{
  "isConfirmation": boolean,
  "isRejection": boolean,
  "willHandleDirectly": boolean,
  "confirmationNumber": string | null,
  "availableDates": string[] | null,
  "price": number | null,
  "notes": string | null
}`,
        },
        {
          role: 'user',
          content: `Parse this operator reply:\n\n${content}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      isConfirmation: result.isConfirmation || false,
      isRejection: result.isRejection || false,
      willHandleDirectly: result.willHandleDirectly || false,
      confirmationNumber: result.confirmationNumber || undefined,
      availableDates: result.availableDates || undefined,
      price: result.price || undefined,
      notes: result.notes || undefined,
    };
  } catch (error) {
    console.error('OpenAI parsing error:', error);
    return {
      isConfirmation: false,
      isRejection: false,
      willHandleDirectly: false,
    };
  }
}

/**
 * Extract booking information from VAPI call transcript
 * 
 * This function analyzes a phone call transcript and extracts all booking information
 * that was collected during the call.
 */
export async function extractBookingFromCallTranscript(transcript: string, callerPhone?: string): Promise<{
  isSpam: boolean;
  isBookingRequest: boolean;
  confidence: number;
  extractedData?: {
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
  };
  intent?: string;
}> {
  try {
    // First check for spam/off-topic calls
    const spamCheck = await detectSpam(transcript, callerPhone, 'Phone Call');
    if (spamCheck.isSpam && spamCheck.confidence > 0.7) {
      return {
        isSpam: true,
        isBookingRequest: false,
        confidence: spamCheck.confidence,
        intent: 'spam',
      };
    }

    // Extract booking information from transcript
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a phone call transcript from a helicopter tour booking agent conversation.

The agent is a friendly booking agent for Helicopter Tours on Oahu. The agent collects:
- name (required)
- email (required)
- phone (optional but helpful)
- party_size (1-20 people, required)
- preferred_date (YYYY-MM-DD format, required)
- time_window (morning, afternoon, evening, or flexible, required)
- doors_off (yes/no, required, default: no)
- hotel (where they're staying, optional)
- special_requests (any special needs, optional)
- total_weight (combined weight of all passengers in lbs, minimum 100, required)

Extract all booking information mentioned in the conversation. If information is missing, set it to null.

Return JSON only:
{
  "isBookingRequest": boolean,
  "confidence": number (0-1, how confident you are that this is a booking request),
  "intent": string (brief description of the call),
  "extractedData": {
    "name": string | null,
    "email": string | null,
    "phone": string | null,
    "party_size": number | null,
    "preferred_date": string | null (YYYY-MM-DD format),
    "time_window": string | null (morning/afternoon/evening/flexible),
    "doors_off": boolean | null,
    "hotel": string | null,
    "special_requests": string | null,
    "total_weight": number | null (minimum 100 lbs)
  }
}

If the call is spam, off-topic, or not a booking request, set isBookingRequest to false.`,
        },
        {
          role: 'user',
          content: `Analyze this phone call transcript and extract booking information:\n\n${transcript}\n\nCaller Phone: ${callerPhone || 'unknown'}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      isSpam: spamCheck.isSpam,
      isBookingRequest: result.isBookingRequest || false,
      confidence: result.confidence || 0.5,
      intent: result.intent || 'unknown',
      extractedData: result.extractedData ? {
        name: result.extractedData.name || undefined,
        email: result.extractedData.email || undefined,
        phone: result.extractedData.phone || callerPhone || undefined,
        party_size: result.extractedData.party_size || undefined,
        preferred_date: result.extractedData.preferred_date || undefined,
        time_window: result.extractedData.time_window || undefined,
        doors_off: result.extractedData.doors_off !== undefined ? result.extractedData.doors_off : undefined,
        hotel: result.extractedData.hotel || undefined,
        special_requests: result.extractedData.special_requests || undefined,
        total_weight: result.extractedData.total_weight || undefined,
      } : undefined,
    };
  } catch (error) {
    console.error('OpenAI transcript analysis error:', error);
    return {
      isSpam: false,
      isBookingRequest: false,
      confidence: 0,
      intent: 'analysis_failed',
    };
  }
}
