import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAvailability } from '@/lib/browserAutomation';
import { sendAvailabilityFollowUp } from '@/lib/email';
import { getBookingByRefCode, updateBooking } from '@/lib/supabaseClient';
import { bookingStatuses } from '@/lib/constants';
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
    if (booking.status === bookingStatuses.AWAITING_PAYMENT || booking.status === bookingStatuses.CONFIRMED) {
      return NextResponse.json(
        { success: false, error: 'Booking already processed' },
        { status: 400 }
      );
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

    // Send follow-up email with availability
    let emailResult;
    try {
      emailResult = await sendAvailabilityFollowUp({
        customerEmail: booking.customer_email || '',
        customerName: booking.customer_name || 'Valued Customer',
        refCode: booking.ref_code || '',
        tourName: tourName,
        operatorName: booking.operator_name || 'Helicopter Tours',
        date: booking.preferred_date || '',
        partySize: booking.party_size || 2,
        availableSlots: availabilityResult.availableSlots || [],
        totalPrice: totalPrice,
        phoneNumber: VAPI_PHONE_NUMBER,
      });

      if (emailResult.success) {
        console.log('Availability follow-up email sent to:', booking.customer_email);
      } else {
        console.error('Availability follow-up email failed:', emailResult.error);
      }
    } catch (error) {
      console.error('Error sending availability follow-up email:', error);
      emailResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Update booking with availability results
    const updatedMetadata = {
      ...(booking.metadata as object || {}),
      availability_check: availabilityResult,
      availability_checked_at: new Date().toISOString(),
      follow_up_email_sent: emailResult.success,
      follow_up_email_sent_at: emailResult.success ? new Date().toISOString() : null,
    };

    await updateBooking(booking.id, {
      status: bookingStatuses.AWAITING_PAYMENT,
      metadata: updatedMetadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Availability checked and follow-up email sent',
      availability: availabilityResult,
      emailSent: emailResult.success,
      emailError: emailResult.error,
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
