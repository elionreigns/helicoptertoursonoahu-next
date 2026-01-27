import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { operators } from '@/lib/constants'; // Import operators for operator selection
import { sendBookingRequestToOperator, sendConfirmationToCustomer } from '@/lib/email';
import { checkAvailability } from '@/lib/browserAutomation';

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

    // Insert booking into Supabase
    const { data: booking, error: dbError } = await supabase
      .from('bookings')
      .insert({
        ref_code: refCode,
        customer_name: validated.name,
        customer_email: validated.email,
        customer_phone: validated.phone || null,
        party_size: validated.party_size,
        preferred_date: validated.preferred_date,
        time_window: validated.time_window || null,
        doors_off: validated.doors_off || false,
        hotel: validated.hotel || null,
        special_requests: validated.special_requests || null,
        total_weight: validated.total_weight,
        source: validated.source,
        status: 'pending',
        operator_name: operator.name,
        metadata: {
          ...(paymentMetadata && { payment: paymentMetadata }),
          ...(availabilityResult && { availability_check: availabilityResult }),
          tour_name: validated.tour_name || null,
        },
      } as any)
      .select()
      .single();

    if (dbError || !booking) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create booking', details: dbError?.message },
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

    // Send booking request email to operator (includes availability results and payment if provided)
    try {
      await sendBookingRequestToOperator({
        operatorEmail: operator.email,
        operatorName: operator.name,
        bookingDetails: {
          customerName: validated.name,
          customerEmail: validated.email,
          customerPhone: validated.phone || 'Not provided',
          partySize: validated.party_size,
          preferredDate: validated.preferred_date,
          timeWindow: validated.time_window,
          doorsOff: validated.doors_off,
          hotel: validated.hotel,
          specialRequests: validated.special_requests,
          totalWeight: validated.total_weight,
        },
        availabilityResult: availabilityResult,
        paymentDetails: paymentDetailsForOperator, // Full payment details (forwarded securely, not stored)
        refCode: refCode,
      });
      console.log('Booking request email sent to operator:', operator.email);
      
      // After sending email, clear payment details from memory (they're in email, not stored)
      paymentDetailsForOperator = null;
    } catch (error) {
      console.error('Error sending booking request email to operator:', error);
      // Don't fail the booking if email fails
    }

    // Send confirmation email to customer
    try {
      await sendConfirmationToCustomer({
        customerEmail: validated.email,
        customerName: validated.name,
        bookingDetails: {
          operatorName: operator.name,
          date: validated.preferred_date,
          partySize: validated.party_size,
        },
        confirmationNumber: refCode,
        hasPayment: !!validated.payment,
      });
      console.log('Confirmation email sent to customer:', validated.email);
    } catch (error) {
      console.error('Error sending confirmation email to customer:', error);
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
