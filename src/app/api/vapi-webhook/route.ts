import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractBookingFromCallTranscript } from '@/lib/openai';
import { sendClientInteractionAlert } from '@/lib/email';

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
 * Receives VAPI call events and processes booking information.
 * On every completed call, emails coralcrowntechnologies@gmail.com with transcript.
 * Extracts booking data from transcript, then calls /api/new-booking-request
 * so phone bookings use the same flow as form and chatbot.
 *
 * Webhook URL: https://booking.helicoptertoursonoahu.com/api/vapi-webhook
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    path: '/api/vapi-webhook',
    method: 'POST',
    description: 'VAPI end-of-call webhook; alerts on every completed call; forwards bookings to /api/new-booking-request',
    secretConfigured: Boolean(process.env.VAPI_WEBHOOK_SECRET?.trim()),
  });
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET?.trim();
    if (webhookSecret) {
      const provided =
        request.headers.get('x-vapi-webhook-secret') ??
        request.headers.get('X-Vapi-Webhook-Secret') ??
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
      if (provided !== webhookSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    console.log('VAPI webhook received:', { type: body.message?.type, callId: body.message?.call?.id });

    let validated;
    try {
      validated = vapiWebhookSchema.parse(body);
    } catch (error) {
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

    const isCallEnded = call?.status === 'ended' ||
                       call?.status === 'ended-by-customer' ||
                       call?.status === 'ended-by-assistant' ||
                       eventType === 'end-of-call-report' ||
                       eventType === 'hang' ||
                       call?.endedReason;

    if (!isCallEnded && !transcript && (!conversation || conversation.length === 0)) {
      return NextResponse.json({
        success: true,
        message: 'Event received, waiting for call completion',
      });
    }

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
    const callId = call?.id;
    const durationSeconds = call?.duration;
    const endedReason = call?.endedReason || call?.status || eventType;

    let outcome = 'call_completed';
    let refCode: string | undefined;
    let customerName: string | undefined;
    let customerEmail: string | undefined;
    let summary: string | undefined;
    let responsePayload: Record<string, unknown> = {
      success: true,
      action: 'end_call',
      message: 'Thank you for calling Helicopter Tours on Oahu. Have a great day!',
    };

    console.log('Extracting booking information from transcript...');
    const extraction = await extractBookingFromCallTranscript(fullTranscript, callerPhone);

    if (extraction.isSpam) {
      outcome = 'spam';
      summary = 'Call classified as spam/off-topic';
      responsePayload = {
        success: true,
        action: 'end_call',
        message: 'Thank you for calling Helicopter Tours on Oahu. If you\'re interested in booking a tour, please visit our website or call back. Have a great day!',
      };
    } else if (!extraction.isBookingRequest || extraction.confidence < 0.5) {
      outcome = 'not_a_booking';
      summary = `Not a booking request (confidence: ${extraction.confidence})`;
      responsePayload = {
        success: true,
        action: 'end_call',
        message: 'Thank you for calling Helicopter Tours on Oahu. If you\'d like to book a tour, please call back or visit our website. Have a great day!',
      };
    } else {
      const extractedData = extraction.extractedData;
      customerName = extractedData?.name;
      customerEmail = extractedData?.email;

      if (!extractedData) {
        outcome = 'incomplete_extraction';
        summary = 'Booking intent detected but no structured data extracted';
        responsePayload = {
          success: true,
          action: 'end_call',
          message: 'Thank you for calling. We couldn\'t collect all the necessary information. Please call back or visit our website to complete your booking.',
        };
      } else {
        const requiredFields = ['name', 'email', 'party_size', 'preferred_date', 'time_window', 'total_weight'];
        const missingFields = requiredFields.filter(field => {
          if (field === 'total_weight') {
            return !extractedData.total_weight || extractedData.total_weight < 100;
          }
          return !extractedData[field as keyof typeof extractedData];
        });

        if (missingFields.length > 0) {
          outcome = 'missing_fields';
          summary = `Missing fields: ${missingFields.join(', ')}`;
          responsePayload = {
            success: true,
            action: 'continue',
            message: `I need a bit more information to complete your booking. Please provide: ${missingFields.join(', ')}. Thank you!`,
          };
        } else if (extractedData.total_weight && extractedData.total_weight < 100) {
          outcome = 'invalid_weight';
          summary = 'Total weight below minimum (100 lbs)';
          responsePayload = {
            success: true,
            action: 'continue',
            message: 'The total weight must be at least 100 lbs for safety reasons. Could you please provide the combined weight of all passengers?',
          };
        } else {
          // Blue Hawaiian only — Rainbow bookings paused
          const operatorKey: 'blueHawaiian' = 'blueHawaiian';

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
            || 'https://booking.helicoptertoursonoahu.com';
          const bookingPayload = {
            name: extractedData.name ?? 'Unknown',
            email: extractedData.email!,
            phone: extractedData.phone || callerPhone || undefined,
            party_size: extractedData.party_size!,
            preferred_date: extractedData.preferred_date!,
            time_window: extractedData.time_window ?? 'Flexible',
            doors_off: extractedData.doors_off ?? false,
            hotel: extractedData.hotel ?? undefined,
            special_requests: extractedData.special_requests ?? undefined,
            total_weight: extractedData.total_weight!,
            source: 'phone' as const,
            operator_preference: operatorKey,
          };

          console.log('Calling new-booking-request for phone booking...');
          const bookRes = await fetch(`${baseUrl}/api/new-booking-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload),
          });

          const bookResult = await bookRes.json();

          if (!bookResult.success || !bookResult.ref_code) {
            outcome = 'booking_failed';
            summary = bookResult.error || 'new-booking-request failed';
            console.error('new-booking-request failed:', bookResult.error || bookResult);
            responsePayload = {
              success: false,
              action: 'end_call',
              message: 'I apologize, but we encountered an issue processing your booking. Please call back or visit our website. Thank you!',
              error: bookResult.error || 'Failed to create booking',
            };
          } else {
            outcome = 'booking_created';
            refCode = bookResult.ref_code;
            customerName = extractedData.name ?? customerName;
            customerEmail = extractedData.email ?? customerEmail;
            summary = `Booking created — ${refCode}, party ${extractedData.party_size}, date ${extractedData.preferred_date}`;
            responsePayload = {
              success: true,
              action: 'end_call',
              message: `Perfect! I've submitted your booking request. Your reference code is ${refCode}. You'll receive a confirmation email from us at the email you provided shortly, and we'll check availability and get back to you soon. Thank you for calling Helicopter Tours on Oahu!`,
              booking: {
                ref_code: refCode,
                id: bookResult.booking?.id,
              },
            };
          }
        }
      }
    }

    // Alert on every completed VAPI interaction
    try {
      const alertResult = await sendClientInteractionAlert({
        source: 'vapi',
        outcome,
        customerName,
        customerEmail,
        customerPhone: callerPhone,
        refCode,
        callId,
        durationSeconds,
        endedReason,
        transcript: fullTranscript,
        summary,
      });
      if (!alertResult.success) {
        console.error('VAPI client interaction alert failed:', alertResult.error);
      }
    } catch (alertErr) {
      console.error('Error sending VAPI client interaction alert:', alertErr);
    }

    return NextResponse.json(responsePayload);
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