import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAvailability } from '@/lib/browserAutomation';
import { sendRainbowFirstFollowUp, sendBlueHawaiianFirstFollowUp, sendRainbowArrangeNotificationToAgent } from '@/lib/email';
import { getBookingByRefCode, updateBooking } from '@/lib/supabaseClient';
import { bookingStatuses, emails, isOperatorOrInternalEmail } from '@/lib/constants';
import { VAPI_PHONE_NUMBER } from '@/lib/constants';
import { getTourById } from '@/lib/tours';

const requestSchema = z.object({
  bookingId: z.string().uuid().optional(),
  refCode: z.string().optional(),
});

/**
 * POST /api/check-availability-and-followup
 * 
 * Checks availability for a booking and sends follow-up email with available time slots
 * Can be called with bookingId or refCode
 * 
 * This endpoint:
 * 1. Fetches booking from database
 * 2. Checks availability using Browserbase (for Blue Hawaiian) or marks manual check (for Rainbow)
 * 3. Sends follow-up email to customer with available time slots
 * 4. Updates booking status and metadata
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);

    if (!validated.bookingId && !validated.refCode) {
      return NextResponse.json(
        { success: false, error: 'Either bookingId or refCode is required' },
        { status: 400 }
      );
    }

    // Fetch booking from database
    let booking;
    if (validated.bookingId) {
      // TODO: Implement getBookingById if needed
      return NextResponse.json(
        { success: false, error: 'bookingId lookup not yet implemented, use refCode' },
        { status: 400 }
      );
    } else {
      const result = await getBookingByRefCode(validated.refCode!);
      if (result.error || !result.data) {
        return NextResponse.json(
          { success: false, error: 'Booking not found', details: result.error?.message },
          { status: 404 }
        );
      }
      booking = result.data;
    }

    // Check if booking already has availability checked
    // Allow re-running if status is still pending or checking_availability (for retries)
    if (booking.status === bookingStatuses.CONFIRMED) {
      return NextResponse.json(
        { success: false, error: 'Booking already confirmed' },
        { status: 400 }
      );
    }
    
    // If already awaiting payment, still allow re-sending follow-up email if needed
    if (booking.status === bookingStatuses.AWAITING_PAYMENT) {
      console.log('Booking already in awaiting_payment status, but continuing to ensure follow-up email is sent');
    }

    // Update status to checking_availability
    await updateBooking(booking.id, {
      status: bookingStatuses.CHECKING_AVAILABILITY,
    });

    // Determine operator
    const operatorKey = booking.operator_name?.toLowerCase().includes('rainbow') ? 'rainbow' : 'blueHawaiian';
    
    // Get tour info for pricing
    const tourName = booking.metadata?.tour_name as string || 'Helicopter Tour';
    const tour = getTourById(booking.metadata?.tour_id as string || '');

    // Check availability
    let availabilityResult;
    try {
      availabilityResult = await checkAvailability({
        operator: operatorKey,
        date: booking.preferred_date || '',
        partySize: booking.party_size || 2,
        tourName: tourName,
        timeWindow: booking.time_window || undefined,
      });
    } catch (error) {
      console.error('Availability check error:', error);
      availabilityResult = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error',
      };
    }

    // Calculate total price
    const pricePerPerson = tour?.pricePerPerson || 299; // Default if tour not found
    const totalPrice = pricePerPerson * (booking.party_size || 2);

    // Send follow-up email with availability — TO THE CLIENT ONLY (never to operator/hub/agent)
    // Resend rate limit: 2 req/sec — wait so new-booking-request (inquiry + confirmation) can finish first
    await new Promise((r) => setTimeout(r, 1500));
    let emailResult;
    try {
      // Ensure we have required data
      if (!booking.customer_email) {
        throw new Error('Customer email is missing from booking');
      }
      // Safeguard: never send the client follow-up to an operator, hub, or test agent
      if (isOperatorOrInternalEmail(booking.customer_email)) {
        console.error(
          'CRITICAL: Follow-up email blocked — booking.customer_email is an operator/hub/agent address. ' +
          'The "Available Tour Times" email must go only to the client who booked. ' +
          'customer_email was:',
          booking.customer_email
        );
        emailResult = { success: false, error: 'Follow-up not sent: customer_email is operator/hub/agent — use the real client email' };
      } else if (operatorKey === 'rainbow') {
        emailResult = await sendRainbowFirstFollowUp({
          customerEmail: booking.customer_email,
          customerName: booking.customer_name || 'Valued Customer',
          refCode: booking.ref_code || '',
          tourName: tourName,
          date: booking.preferred_date || '',
          phoneNumber: VAPI_PHONE_NUMBER,
        });
      } else {
        emailResult = await sendBlueHawaiianFirstFollowUp({
          customerEmail: booking.customer_email,
          customerName: booking.customer_name || 'Valued Customer',
          refCode: booking.ref_code || '',
          tourName: tourName,
          date: booking.preferred_date || '',
          partySize: booking.party_size || 2,
          totalPrice: totalPrice,
          availableSlots: availabilityResult.availableSlots || [],
          phoneNumber: VAPI_PHONE_NUMBER,
        });
      }

      if (emailResult.success) {
        console.log('✅ Availability follow-up email sent successfully to:', booking.customer_email);
        // When Rainbow: also notify the internal agent to arrange with Rainbow
        if (operatorKey === 'rainbow' && emails.testAgent) {
          try {
            // Resend rate limit: 2 req/sec — delay before next send
            await new Promise((r) => setTimeout(r, 600));
            await sendRainbowArrangeNotificationToAgent({
              agentEmail: emails.testAgent,
              refCode: booking.ref_code || '',
              customerName: booking.customer_name || 'Customer',
              customerEmail: booking.customer_email || '',
              tourName: tourName,
              date: booking.preferred_date || '',
              partySize: booking.party_size || 2,
            });
            console.log('✅ Rainbow arrange notification sent to agent:', emails.testAgent);
          } catch (agentErr) {
            console.error('Rainbow arrange notification to agent failed:', agentErr);
          }
        }
      } else {
        console.error('❌ Availability follow-up email failed:', emailResult.error);
        // Log this as a critical error since follow-up email is essential
        console.error('CRITICAL: Follow-up email failed for booking:', booking.ref_code);
      }
    } catch (error) {
      console.error('❌ Error sending availability follow-up email:', error);
      emailResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      // This is critical - log it prominently
      console.error('CRITICAL: Failed to send follow-up email for booking:', booking.ref_code, error);
    }

    // Update booking with availability results
    const updatedMetadata = {
      ...(booking.metadata as object || {}),
      availability_check: availabilityResult,
      availability_checked_at: new Date().toISOString(),
      follow_up_email_sent: emailResult.success,
      follow_up_email_sent_at: emailResult.success ? new Date().toISOString() : null,
    };

    // Update booking status - only move to awaiting_payment if email was sent successfully
    // If email failed, keep status as checking_availability so it can be retried
    const newStatus = emailResult.success 
      ? bookingStatuses.AWAITING_PAYMENT 
      : bookingStatuses.CHECKING_AVAILABILITY;
    
    await updateBooking(booking.id, {
      status: newStatus,
      metadata: updatedMetadata,
    });

    // Return success even if availability check failed, as long as email was sent
    const overallSuccess = emailResult.success;
    
    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'Availability checked and follow-up email sent' 
        : 'Availability checked but follow-up email failed - please retry',
      availability: availabilityResult,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      warning: emailResult.success ? undefined : 'Follow-up email failed - customer may not receive availability information',
    });
  } catch (error) {
    console.error('Check availability and follow-up error:', error);

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
