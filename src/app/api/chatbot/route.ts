import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

/**
 * POST /api/chatbot
 * 
 * Handles chatbot messages for booking assistance
 * Uses OpenAI to understand user intent and collect booking information
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversation_history = [], user_email, booking_data = {} } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build system prompt for booking assistant
    const systemPrompt = `You are a helpful booking assistant for Helicopter Tours on Oahu. Your job is to:
1. Help customers book helicopter tours
2. Collect booking information: name, email, phone, party_size, preferred_date, time_window, doors_off preference, hotel, special_requests, total_weight
3. Answer questions about tours, pricing, and availability using information from vital_information.php
4. Be friendly, professional, and helpful
5. When you have all required information, indicate booking_ready: true

Required booking fields:
- name (customer name) - REQUIRED
- email (customer email - ${user_email ? `already have: ${user_email}` : 'need to collect'}) - REQUIRED
- phone (optional but helpful)
- party_size (number of people, 1-20) - REQUIRED
- preferred_date (YYYY-MM-DD format) - REQUIRED
- time_window (morning, afternoon, evening, or flexible) - REQUIRED
- doors_off (true/false) - REQUIRED (default false)
- hotel (where they're staying, optional)
- special_requests (any special needs, optional)
- total_weight (combined weight of all passengers in lbs, minimum 100) - REQUIRED

Current booking data collected so far:
${JSON.stringify(booking_data, null, 2)}

When responding:
- If you're collecting information, ask one question at a time
- Be conversational and friendly
- Answer questions about tours and pricing when asked
- If you have all required info (name, email, party_size, preferred_date, time_window, total_weight), say 'I have all the information I need. Would you like me to submit your booking request now?'
- Return your response as JSON with: {"message": "your response text", "booking_ready": true/false, "booking_data": {...updated data...}}

IMPORTANT: Always return valid JSON. The message field should be your conversational response to the user.`;

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history
    conversation_history.forEach((msg: { role: string; content: string }) => {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let parsed: {
      message: string;
      booking_ready?: boolean;
      booking_data?: BookingData;
    };

    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback if JSON parsing fails
      parsed = {
        message: content,
        booking_ready: false,
        booking_data: booking_data,
      };
    }

    // Ensure we have a message
    if (!parsed.message) {
      parsed.message = content;
    }

    // Merge booking data
    const updatedBookingData: BookingData = {
      ...booking_data,
      ...(parsed.booking_data || {}),
    };

    // If email was provided but not in booking data, add it
    if (user_email && !updatedBookingData.email) {
      updatedBookingData.email = user_email;
    }

    return NextResponse.json({
      response: parsed.message,
      booking_ready: parsed.booking_ready || false,
      booking_data: updatedBookingData,
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
