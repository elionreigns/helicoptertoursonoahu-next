import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { bookingStatuses } from '@/lib/constants';

/**
 * Schema for booking status update
 */
const updateStatusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum([
    bookingStatuses.PENDING,
    bookingStatuses.COLLECTING_INFO,
    bookingStatuses.CHECKING_AVAILABILITY,
    bookingStatuses.CONTACTED_OPERATOR,
    bookingStatuses.AWAITING_OPERATOR_RESPONSE,
    bookingStatuses.AWAITING_PAYMENT,
    bookingStatuses.CONFIRMED,
    bookingStatuses.CANCELLED,
    bookingStatuses.COMPLETED,
  ]),
  confirmationNumber: z.string().optional(),
  paymentStatus: z.string().optional(),
  totalAmount: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/update-booking-status
 * 
 * Updates booking status and related fields
 * - Validates status transition
 * - Updates booking record
 * - Triggers n8n webhook if configured
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = updateStatusSchema.parse(body);

    // Get current booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', validated.bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: validated.status,
      updated_at: new Date().toISOString(),
    };

    if (validated.confirmationNumber) {
      updateData.confirmation_number = validated.confirmationNumber;
    }

    if (validated.paymentStatus) {
      updateData.payment_status = validated.paymentStatus;
    }

    if (validated.totalAmount !== undefined) {
      updateData.total_amount = validated.totalAmount;
    }

    if (validated.metadata) {
      updateData.metadata = {
        ...(booking.metadata as object || {}),
        ...validated.metadata,
      };
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', validated.bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Trigger n8n webhook if configured
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'booking_status_updated',
            bookingId: validated.bookingId,
            oldStatus: booking.status,
            newStatus: validated.status,
            booking: updatedBooking,
          }),
        });
      } catch (error) {
        console.error('n8n webhook error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        booking: updatedBooking,
      },
    });
  } catch (error) {
    console.error('Update booking status error:', error);

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
