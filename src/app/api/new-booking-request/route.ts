import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertBooking } from '@/lib/supabaseClient';
import type { BookingsInsert } from '@/lib/database.types';
import { operators } from '@/lib/constants'; // Import operators for operator selection
import { sendBookingRequestToOperator, sendConfirmationToCustomer, sendRainbowAvailabilityInquiry } from '@/lib/email';
import { checkAvailability } from '@/lib/browserAutomation';
import { getTourById, calculateTotalPrice } from '@/lib/tours';

export const maxDuration = 30;

/**
 * IMPORTANT: Operator selection uses operators from constants.ts
 * To update operator emails, edit src/lib/constants.ts
 * No hard-coded emails exist in this file
 */

/**
 * Generate unique reference code: HTO- + 6 random uppercase letters/numbers
 * 
 * Collision probability: ~1 in 2 billion (36^6 possible combinations)
 * If collision occurs, database will reject due to unique constraint
 * In that case, we can retry with a new code
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
 * Schema for new booking request
 */
const bookingRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  /** Client email for this booking only — used for confirmation, follow-up, and reply matching for this booking. */
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  party_size: z.number().int().min(1).max(20, 'Party size must be between 1 and 20'),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time_window: z.string().optional(),
  doors_off: z.boolean().optional().default(false),
  hotel: z.string().optional(),
  special_requests: z.string().optional(),
  total_weight: z.number().int().positive().min(100, 'Total weight must be at least 100 lbs'),
  source: z.enum(['web', 'chatbot', 'phone']).default('web'),
  // Optional payment information (will be forwarded to operator, not stored)
  payment: z.object({
    card_name: z.string(),
    card_number: z.string(),
    card_expiry: z.string(),
    card_cvc: z.string(),
    billing_address: z.string().optional(),
    billing_zip: z.string().optional(),
  }).optional(),
  // Optional operator preference
  operator_preference: z.enum(['blueHawaiian', 'rainbow']).optional(),
  tour_name: z.string().optional(),
  tour_id: z.string().optional(), // Tour ID for pricing lookup
});

/**
 * POST /api/new-booking-request
 * 
 * Creates a new booking request from web form, chatbot, or phone agent
 * - Validates incoming JSON body using zod
 * - Inserts validated data into Supabase public.bookings table
 * - Generates unique ref_code like 'HTO-' + 6 random uppercase letters/numbers
 * - Calls n8n webhook using env variable N8N_NEW_BOOKING_WEBHOOK_URL
 * - Returns JSON { success: true, ref_code, message } or error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bookingRequestSchema.parse(body);

    // Generate unique reference code if not provided
    const refCode = generateRefCode();

    // Determine operator preference
    const operatorKey: 'blueHawaiian' | 'rainbow' = validated.operator_preference || 'blueHawaiian';
    const operator = operators[operatorKey];

    // Get tour information for pricing and display
    let tourName: string | undefined;
    let totalPrice: number | undefined;
    if (validated.tour_id) {
      const tour = getTourById(validated.tour_id);
      if (tour) {
        tourName = tour.name;
        totalPrice = calculateTotalPrice(validated.tour_id, validated.party_size);
      }
    } else if (validated.tour_name) {
      tourName = validated.tour_name;
      // If no tour_id but tour_name provided, we can't calculate exact price
      // Will use default pricing in follow-up email
    }

    // Check availability (for Blue Hawaiian, use FareHarbor; for Rainbow, email operator)
    let availabilityResult: { 
      available: boolean; 
      details?: any; 
      error?: string; 
      source?: string;
      availableSlots?: Array<{ time: string; price?: number; available: boolean }>;
    } | null = null;
    
    try {
      console.log(`Checking availability for ${operatorKey} on ${validated.preferred_date}...`);
      availabilityResult = await checkAvailability({
        operator: operatorKey,
        date: validated.preferred_date,
        partySize: validated.party_size,
        tourName: validated.tour_name,
        timeWindow: validated.time_window,
      });
      
      console.log('Availability check result:', availabilityResult);
      
      // For Blue Hawaiian: if multiple slots available, we could return them to user
      // For now, we'll proceed and include availability in email to operator
      if (operatorKey === 'blueHawaiian' && availabilityResult.available && availabilityResult.availableSlots) {
        console.log(`Found ${availabilityResult.availableSlots.length} available time slots`);
      }
      
      // For Rainbow: availability check returns manual check required
      if (operatorKey === 'rainbow') {
        console.log('Rainbow Helicopters requires manual availability check - operator will be contacted');
      }
    } catch (error) {
      console.error('Error checking availability (non-blocking):', error);
      // Don't fail the booking if availability check fails
      availabilityResult = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error',
      };
    }

    // Handle payment information securely
    // Extract last 4 digits only for storage, forward full details to operator
    let paymentMetadata: any = null;
    let paymentDetailsForOperator: any = null;
    
    if (validated.payment) {
      const cardNumber = validated.payment.card_number.replace(/\s/g, '');
      const last4 = cardNumber.slice(-4);
      
      // Store only last4 in metadata (for reference)
      paymentMetadata = {
        card_name: validated.payment.card_name,
        card_last4: last4,
        card_expiry: validated.payment.card_expiry,
        billing_address: validated.payment.billing_address,
        billing_zip: validated.payment.billing_zip,
        has_payment: true,
      };
      
      // Full payment details for operator (will be sent via email, not stored)
      paymentDetailsForOperator = {
        card_name: validated.payment.card_name,
        card_number: validated.payment.card_number,
        card_expiry: validated.payment.card_expiry,
        card_cvc: validated.payment.card_cvc,
        billing_address: validated.payment.billing_address,
        billing_zip: validated.payment.billing_zip,
      };
      
      console.log('Payment information provided - will forward to operator securely');
    }

    // Insert booking into Supabase (typed client; no casts)
    // The email from this form submission is stored as this booking's client — used only for this booking (confirmation, follow-up, reply matching).
    const now = new Date().toISOString();
    const insertPayload: BookingsInsert = {
      ref_code: refCode,
      customer_name: validated.name,
      customer_email: validated.email,
      customer_phone: validated.phone ?? null,
      party_size: validated.party_size,
      preferred_date: validated.preferred_date,
      time_window: validated.time_window ?? null,
      doors_off: validated.doors_off ?? false,
      hotel: validated.hotel ?? null,
      special_requests: validated.special_requests ?? null,
      total_weight: validated.total_weight,
      source: validated.source,
      status: 'pending',
      operator_name: operator.name,
      updated_at: now,
      metadata: {
        ...(paymentMetadata && { payment: paymentMetadata }),
        ...(availabilityResult && { availability_check: availabilityResult }),
        tour_name: validated.tour_name ?? null,
        tour_id: validated.tour_id ?? validated.tour_name ?? null, // Store tour ID for pricing lookup
      },
    };
    const { data: booking, error: dbError } = await insertBooking(insertPayload);

    if (dbError || !booking) {
      console.error('Database error:', dbError);
      const details = dbError?.message ?? dbError?.code ?? null;
      return NextResponse.json(
        { success: false, error: 'Failed to create booking', details },
        { status: 500 }
      );
    }

    // Prepare booking data for n8n webhook (include total_weight and availability result)
    const bookingData = {
      id: booking.id,
      ref_code: refCode,
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      party_size: validated.party_size,
      preferred_date: validated.preferred_date,
      time_window: validated.time_window,
      doors_off: validated.doors_off,
      hotel: validated.hotel,
      special_requests: validated.special_requests,
      total_weight: validated.total_weight,
      source: validated.source,
      created_at: booking.created_at,
      availability_check: availabilityResult || null, // Include availability check result
      operator_preference: operatorKey,
      tour_name: validated.tour_name || null,
      has_payment: !!validated.payment, // Boolean flag (payment details not included in webhook)
    };

    // Operator email flow:
    // - Blue Hawaiian: do NOT email operator yet; we scrape live availability and send follow-up to customer.
    //   When customer replies with chosen time, we then send full booking to Blue Hawaiian (see customer-reply).
    // - Rainbow: send availability inquiry only ("what times do you have?"); when Rainbow replies with a time,
    //   we email customer to confirm; when customer confirms, we send full booking to Rainbow (see operator-reply + customer-reply).
    try {
      if (operatorKey === 'rainbow') {
        const inquiryResult = await sendRainbowAvailabilityInquiry({
          operatorEmail: operator.email,
          operatorName: operator.name,
          refCode,
          customerName: validated.name,
          preferredDate: validated.preferred_date,
          partySize: validated.party_size,
          tourName: tourName,
          totalWeight: validated.total_weight,
          doorsOff: validated.doors_off,
          hotel: validated.hotel,
        });
        if (inquiryResult.success) {
          console.log('Rainbow availability inquiry sent to operator:', operator.email);
        } else {
          console.error('Rainbow availability inquiry failed:', inquiryResult.error);
        }
        // Resend rate limit: 2 req/sec — delay before next send
        await new Promise((r) => setTimeout(r, 800));
      }
      // Blue Hawaiian: no operator email on booking; operator gets full details when customer confirms a time
      if (operatorKey === 'blueHawaiian') {
        console.log('Blue Hawaiian: operator will be emailed when customer confirms a time slot');
      }
      paymentDetailsForOperator = null;
    } catch (error) {
      console.error('Error sending operator email:', error);
    }

    // Send confirmation email to customer
    try {
      const confirmResult = await sendConfirmationToCustomer({
        customerEmail: validated.email,
        customerName: validated.name,
        bookingDetails: {
          operatorName: operator.name,
          date: validated.preferred_date,
          partySize: validated.party_size,
          totalAmount: totalPrice,
        },
        confirmationNumber: refCode,
        hasPayment: !!validated.payment,
        tourName: tourName,
      });
      if (confirmResult.success) {
        console.log('Confirmation email sent to customer:', validated.email);
      } else {
        console.error('Confirmation email failed:', confirmResult.error);
      }
    } catch (error) {
      console.error('Error sending confirmation email to customer:', error);
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

    // Trigger availability check and follow-up email in background (don't wait)
    // Vercel Deployment Protection: VERCEL_AUTOMATION_BYPASS_SECRET (set in Vercel env vars) is sent so this server-to-server call succeeds
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (bypassSecret) {
      headers['x-vercel-protection-bypass'] = bypassSecret;
    } else if (process.env.VERCEL) {
      console.warn('VERCEL_AUTOMATION_BYPASS_SECRET not set — follow-up will get 401. In Vercel: Settings → Deployment Protection → Protection Bypass for Automation, then add env var or use generated secret.');
    }

    const productionUrl = 'https://booking.helicoptertoursonoahu.com/api/check-availability-and-followup';
    // Prefer production URL so we hit the same domain; preview URLs often have protection
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
      || (process.env.VERCEL_URL && process.env.VERCEL_ENV === 'production' ? `https://${process.env.VERCEL_URL}` : null)
      || 'https://booking.helicoptertoursonoahu.com';
    const availabilityCheckUrl = `${appUrl.replace(/\/$/, '')}/api/check-availability-and-followup`;

    console.log(`Triggering availability check for ${refCode} via ${availabilityCheckUrl}`);

    const triggerAvailabilityCheck = async (url: string, useQueryBypass = false, retries = 2): Promise<void> => {
      try {
        const finalUrl = useQueryBypass && bypassSecret
          ? `${url}${url.includes('?') ? '&' : '?'}x-vercel-protection-bypass=${encodeURIComponent(bypassSecret)}`
          : url;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(finalUrl, {
          method: 'POST',
          headers: useQueryBypass ? { 'Content-Type': 'application/json' } : headers,
          body: JSON.stringify({ refCode }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Availability check API returned ${response.status}:`, errorText.slice(0, 200));
          // On 401: retry with bypass as query param (Vercel supports both header and query)
          if (response.status === 401 && bypassSecret && !useQueryBypass && retries > 0) {
            console.log('Retrying with bypass as query parameter...');
            return triggerAvailabilityCheck(url, true, retries - 1);
          }
          // Try production URL if current URL failed
          if ((response.status === 401 || response.status === 404) && retries > 0 && url !== productionUrl) {
            console.log(`Retrying with production URL: ${productionUrl}`);
            return triggerAvailabilityCheck(productionUrl, false, retries - 1);
          }
          return;
        }
        const result = await response.json();
        console.log('Availability check triggered successfully:', result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Availability check request failed:', message);
        if (retries > 0 && url !== productionUrl) {
          console.log(`Retrying with production URL: ${productionUrl}`);
          return triggerAvailabilityCheck(productionUrl, false, retries - 1);
        }
      }
    };

    triggerAvailabilityCheck(availabilityCheckUrl).catch((err) => {
      console.error('Background availability check failed after retries:', err);
    });

    return NextResponse.json({
      success: true,
      ref_code: refCode,
      message: 'Booking request created successfully',
    });
  } catch (error) {
    console.error('New booking request error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
