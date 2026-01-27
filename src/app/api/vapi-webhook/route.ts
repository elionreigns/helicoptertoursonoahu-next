import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertBooking, type InsertBookingResult } from '@/lib/supabaseClient';
import type { BookingsInsert } from '@/lib/database.types';
import { VAPI_ASSISTANT_ID, emails, operators } from '@/lib/constants';
import { extractBookingFromCallTranscript } from '@/lib/openai';
import { sendEmail, sendConfirmationToCustomer, sendBookingRequestToOperator } from '@/lib/email';

/**
 * Generate unique reference code: HTO- + 6 random uppercase letters/numbers
 */
function generateRefCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'HTO-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Schema for VAPI webhook events
 * VAPI sends various events during a call lifecycle
 * This schema is flexible to handle different VAPI webhook formats
 */
const vapiWebhookSchema = z.object({
  message: z.object({
    type: z.string().optional(),
    status: z.string().optional(),
    transcript: z.string().optional(),
    conversation: z.array(z.object({
      role: z.string(),
      content: z.string(),
    })).optional(),
    call: z.object({
      id: z.string().optional(),
      phoneNumber: z.string().optional(),
      customer: z.object({
        number: z.string().optional(),
      }).optional(),
      assistantId: z.string().optional(),
      status: z.string().optional(),
      endedReason: z.string().optional(),
      cost: z.number().optional(),
      duration: z.number().optional(),
    }).optional(),
  }).passthrough(), // Allow additional fields
});

/**
 * POST /api/vapi-webhook
 * 
 * Receives VAPI call events and processes booking information
 * 
 * IMPORTANT: The VAPI assistant should be configured with the system prompt from:
 * public_html/vapi.md - This contains all tour information, pricing, and booking process details
 * 
 * Webhook URL: https://booking.helicoptertoursonoahu.com/api/vapi-webhook
 * 
 * Process:
 * 1. Receives call events from VAPI (transcript, status updates, etc.)
 * 2. When call ends: extracts booking info from transcript using OpenAI
 * 3. Validates extracted data (name, email, party_size, preferred_date, time_window, total_weight required)
 * 4. Creates booking in Supabase if complete
 * 5. Sends confirmation email to customer (uses emails from constants.ts)
 * 6. Triggers n8n webhook for availability checking
 * 7. Returns response to VAPI with reference code
 * 8. Handles spam/off-topic detection
 * 
 * Uses emails from constants.ts for operator selection - no hard-coded emails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('VAPI webhook received:', { type: body.message?.type, callId: body.message?.call?.id });

    // Validate webhook payload (flexible schema to handle different VAPI formats)
    let validated;
    try {
      validated = vapiWebhookSchema.parse(body);
    } catch (error) {
      // If schema validation fails, try to extract data anyway (VAPI may send different formats)
      console.warn('Schema validation failed, attempting to extract data anyway:', error);
      validated = {
        message: {
          type: body.message?.type || body.type || 'unknown',
          transcript: body.message?.transcript || body.transcript,
          conversation: body.message?.conversation || body.conversation,
          call: body.message?.call || body.call,
        },
      };
    }
    
    const eventType = validated.message.type;
    const call = validated.message.call;
    const transcript = validated.message.transcript;
    const conversation = validated.message.conversation;

    // Only process end-of-call events or when we have a complete transcript
    // VAPI may send different event types, so we check for call completion
    const isCallEnded = call?.status === 'ended' || 
                       call?.status === 'ended-by-customer' || 
                       call?.status === 'ended-by-assistant' ||
                       eventType === 'end-of-call-report' || 
                       eventType === 'hang' ||
                       call?.endedReason;

    if (!isCallEnded && !transcript && (!conversation || conversation.length === 0)) {
      // Acknowledge the event but don't process yet
      return NextResponse.json({
        success: true,
        message: 'Event received, waiting for call completion',
      });
    }

    // Build full transcript from conversation if available
    let fullTranscript = transcript || '';
    if (conversation && conversation.length > 0) {
      fullTranscript = conversation
        .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
        .join('\n');
    }

    if (!fullTranscript || fullTranscript.trim().length === 0) {
      console.log('No transcript available yet');
      return NextResponse.json({
        success: true,
        message: 'No transcript available',
      });
    }

    const callerPhone = call?.customer?.number || call?.phoneNumber || undefined;

    // Extract booking information from transcript
    console.log('Extracting booking information from transcript...');
    const extraction = await extractBookingFromCallTranscript(fullTranscript, callerPhone);

    // Handle spam/off-topic calls
    if (extraction.isSpam) {
      console.log('Spam call detected, ending politely');
      return NextResponse.json({
        success: true,
        action: 'end_call',
        message: 'Thank you for calling Helicopter Tours on Oahu. If you\'re interested in booking a tour, please visit our website or call back. Have a great day!',
      });
    }

    // If not a booking request, acknowledge and end
    if (!extraction.isBookingRequest || extraction.confidence < 0.5) {
      console.log('Not a booking request or low confidence');
      return NextResponse.json({
        success: true,
        action: 'end_call',
        message: 'Thank you for calling Helicopter Tours on Oahu. If you\'d like to book a tour, please call back or visit our website. Have a great day!',
      });
    }

    const extractedData = extraction.extractedData;
    if (!extractedData) {
      console.log('No booking data extracted');
      return NextResponse.json({
        success: true,
        action: 'end_call',
        message: 'Thank you for calling. We couldn\'t collect all the necessary information. Please call back or visit our website to complete your booking.',
      });
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'party_size', 'preferred_date', 'time_window', 'total_weight'];
    const missingFields = requiredFields.filter(field => {
      if (field === 'total_weight') {
        return !extractedData.total_weight || extractedData.total_weight < 100;
      }
      return !extractedData[field as keyof typeof extractedData];
    });

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return NextResponse.json({
        success: true,
        action: 'continue',
        message: `I need a bit more information to complete your booking. Please provide: ${missingFields.join(', ')}. Thank you!`,
      });
    }

    // Validate total_weight
    if (extractedData.total_weight && extractedData.total_weight < 100) {
      return NextResponse.json({
        success: true,
        action: 'continue',
        message: 'The total weight must be at least 100 lbs for safety reasons. Could you please provide the combined weight of all passengers?',
      });
    }

    // Generate reference code
    const refCode = generateRefCode();

    // Determine operator preference from transcript or default to Blue Hawaiian
    // The assistant can mention operator preference during the call
    let operatorKey: keyof typeof operators = 'blueHawaiian'; // Default
    const transcriptLower = fullTranscript.toLowerCase();
    if (transcriptLower.includes('rainbow')) {
      operatorKey = 'rainbow';
    } else if (transcriptLower.includes('blue hawaiian') || transcriptLower.includes('blue hawaii')) {
      operatorKey = 'blueHawaiian';
    }
    const operator = operators[operatorKey];

    // Create booking in Supabase (typed insert – do not use raw supabase.insert().single())
    console.log('Creating booking in Supabase...');
    const insertPayload: BookingsInsert = {
      ref_code: refCode,
      customer_name: extractedData.name ?? 'Unknown',
      customer_email: extractedData.email!,
      customer_phone: extractedData.phone || callerPhone || null,
      party_size: extractedData.party_size!,
      preferred_date: extractedData.preferred_date!,
      time_window: extractedData.time_window ?? null,
      doors_off: extractedData.doors_off ?? false,
      hotel: extractedData.hotel ?? null,
      special_requests: extractedData.special_requests ?? null,
      total_weight: extractedData.total_weight!,
      source: 'phone',
      status: 'pending',
      operator_name: operator.name,
      metadata: {
        vapi_call_id: call?.id,
        caller_phone: callerPhone,
        call_duration: call?.duration,
        call_cost: call?.cost,
        extraction_confidence: extraction.confidence,
      },
    };
    const insertResult: InsertBookingResult = await insertBooking(insertPayload);
    const booking = insertResult.data;
    const dbError = insertResult.error;

    if (dbError || !booking) {
      console.error('Database error creating booking:', dbError);
      return NextResponse.json({
        success: false,
        action: 'end_call',
        message: 'I apologize, but we encountered an issue processing your booking. Please call back or visit our website. Thank you!',
        error: 'Failed to create booking',
      });
    }

    // Prepare booking data for n8n webhook
    const bookingData = {
      id: booking.id,
      ref_code: refCode,
      name: extractedData.name,
      email: extractedData.email,
      phone: extractedData.phone || callerPhone,
      party_size: extractedData.party_size,
      preferred_date: extractedData.preferred_date,
      time_window: extractedData.time_window,
      doors_off: extractedData.doors_off || false,
      hotel: extractedData.hotel,
      special_requests: extractedData.special_requests,
      total_weight: extractedData.total_weight,
      source: 'phone',
      created_at: booking.created_at,
    };

    // Send booking request email to operator
    try {
      await sendBookingRequestToOperator({
        operatorEmail: operator.email,
        operatorName: operator.name,
        bookingDetails: {
          customerName: extractedData.name!,
          customerEmail: extractedData.email!,
          customerPhone: extractedData.phone || callerPhone || 'Not provided',
          partySize: extractedData.party_size!,
          preferredDate: extractedData.preferred_date!,
          timeWindow: extractedData.time_window!,
          doorsOff: extractedData.doors_off || false,
          hotel: extractedData.hotel,
          specialRequests: extractedData.special_requests,
          totalWeight: extractedData.total_weight!,
        },
      });
      console.log('Booking request email sent to operator:', operator.email);
    } catch (error) {
      console.error('Error sending booking request email to operator:', error);
      // Don't fail the booking if email fails
    }

    // Call n8n webhook if configured
    if (process.env.N8N_NEW_BOOKING_WEBHOOK_URL) {
      try {
        const webhookResponse = await fetch(process.env.N8N_NEW_BOOKING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData),
        });

        if (!webhookResponse.ok) {
          console.error('n8n webhook error:', webhookResponse.status, webhookResponse.statusText);
        } else {
          console.log('n8n webhook called successfully');
        }
      } catch (error) {
        console.error('n8n webhook error:', error);
        // Don't fail the booking if webhook fails
      }
    } else {
      console.warn('N8N_NEW_BOOKING_WEBHOOK_URL not configured, skipping webhook call');
    }

    // Send confirmation email to customer
    // Uses emails from constants.ts - no hard-coded emails
    if (extractedData.email) {
      try {
        await sendConfirmationToCustomer({
          customerEmail: extractedData.email,
          customerName: extractedData.name!,
          bookingDetails: {
            operatorName: operator.name,
            date: extractedData.preferred_date!,
            partySize: extractedData.party_size!,
          },
          confirmationNumber: refCode,
        });
        console.log('Confirmation email sent to:', extractedData.email);
      } catch (error) {
        console.error('Error sending confirmation email:', error);
        // Don't fail the booking if email fails
      }
    } else {
      console.warn('No email provided, skipping confirmation email');
    }

    // Return success response to VAPI
    return NextResponse.json({
      success: true,
      action: 'end_call',
      message: `Perfect! I've submitted your booking request. Your reference code is ${refCode}. You'll receive a confirmation email at ${extractedData.email} within 24 hours. We'll check availability and get back to you soon. Thank you for calling Helicopter Tours on Oahu!`,
      booking: {
        ref_code: refCode,
        id: booking.id,
      },
    });
  } catch (error) {
    console.error('VAPI webhook error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook payload',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        action: 'end_call',
        message: 'I apologize, but we encountered an issue. Please call back or visit our website. Thank you for calling Helicopter Tours on Oahu!',
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
