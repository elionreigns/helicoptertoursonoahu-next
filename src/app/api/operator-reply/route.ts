import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { bookingStatuses, operators } from '@/lib/constants'; // Import operators for operator selection
import { parseOperatorReply } from '@/lib/openai';
import { sendEmail, sendConfirmationToCustomer } from '@/lib/email';

/**
 * Schema for operator reply from n8n webhook
 * n8n will send operator email replies to this endpoint
 */
const operatorReplySchema = z.object({
  bookingId: z.string().uuid().optional(), // May be in metadata or email headers
  operatorEmail: z.string().email().optional(), // From email address
  operatorName: z.string().optional(), // Can be inferred from email
  emailContent: z.string(), // Full email body/content
  fromEmail: z.string().email().optional(), // Sender email
  subject: z.string().optional(), // Email subject
  // n8n may also send the booking ref_code
  refCode: z.string().optional(),
});

/**
 * POST /api/operator-reply
 * 
 * Processes incoming operator reply from n8n webhook
 * - Receives operator email reply from n8n
 * - Parses email content using OpenAI
 * - Finds booking by bookingId or refCode
 * - Updates Supabase booking status
 * - Sends confirmation email to customer if booking confirmed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Operator reply received:', { 
      hasBookingId: !!body.bookingId, 
      hasRefCode: !!body.refCode,
      fromEmail: body.fromEmail 
    });
    
    const validated = operatorReplySchema.parse(body);

    // Find booking by bookingId or refCode
    let booking = null;
    let bookingError = null;

    if (validated.bookingId) {
      const result = await supabase
        .from('bookings')
        .select('*')
        .eq('id', validated.bookingId)
        .single();
      booking = result.data;
      bookingError = result.error;
    } else if (validated.refCode) {
      // Search by ref_code in metadata
      const result = await supabase
        .from('bookings')
        .select('*')
        .contains('metadata', { ref_code: validated.refCode })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      booking = result.data;
      bookingError = result.error;
    } else {
      // Try to find by operator email and recent date
      // This is a fallback if n8n doesn't provide bookingId/refCode
      const result = await supabase
        .from('bookings')
        .select('*')
        .eq('operator_name', validated.operatorName || '')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      booking = result.data;
      bookingError = result.error;
    }

    if (bookingError || !booking) {
      console.error('Booking not found:', { 
        bookingId: validated.bookingId, 
        refCode: validated.refCode,
        error: bookingError 
      });
      return NextResponse.json(
        { success: false, error: 'Booking not found. Please provide bookingId or refCode.' },
        { status: 404 }
      );
    }

    // Parse operator reply using OpenAI
    const parsed = await parseOperatorReply(validated.emailContent);
    console.log('Parsed operator reply:', parsed);

    // Determine operator name from email if not provided
    // Uses operators from constants.ts to match operator emails
    let operatorName = validated.operatorName;
    if (!operatorName && validated.operatorEmail) {
      // Match operator email to known operators from constants
      const matchedOperator = Object.values(operators).find(
        op => op.email.toLowerCase() === validated.operatorEmail?.toLowerCase()
      );
      operatorName = matchedOperator?.name || 'Unknown Operator';
    }

    // Update booking based on operator response
    let newStatus = booking.status;
    let updateData: any = {
      updated_at: new Date().toISOString(),
      operator_name: operatorName,
    };

    if (parsed.isConfirmation) {
      newStatus = bookingStatuses.CONFIRMED;
      updateData.status = newStatus;
      updateData.confirmation_number = parsed.confirmationNumber || null;
      updateData.total_amount = parsed.price || null;

      // Send confirmation to customer
      if (booking.customer_email && booking.customer_name) {
        await sendConfirmationToCustomer({
          customerEmail: booking.customer_email,
          customerName: booking.customer_name,
          bookingDetails: {
            operatorName: validated.operatorName || booking.operator_name || 'Operator',
            date: booking.preferred_date || '',
            time: parsed.notes || undefined,
            partySize: booking.party_size || 1,
            totalAmount: parsed.price || undefined,
          },
          confirmationNumber: parsed.confirmationNumber,
        });
      }
    } else if (parsed.isRejection) {
      newStatus = bookingStatuses.CANCELLED;
      updateData.status = newStatus;
      updateData.metadata = {
        ...(booking.metadata as object || {}),
        rejectionReason: parsed.notes,
      };

      // Notify customer of rejection
      if (booking.customer_email && booking.customer_name) {
        await sendEmail({
          to: booking.customer_email,
          subject: 'Booking Update - Alternative Options Available',
          text: `Dear ${booking.customer_name},\n\nUnfortunately, the requested date is not available. We're working on finding alternative options for you. We'll contact you shortly.\n\nBest regards,\nHelicopter Tours on Oahu`,
          html: `<p>Dear ${booking.customer_name},</p><p>Unfortunately, the requested date is not available. We're working on finding alternative options for you. We'll contact you shortly.</p><p>Best regards,<br>Helicopter Tours on Oahu</p>`,
        });
      }
    } else if (parsed.availableDates && parsed.availableDates.length > 0) {
      // Operator provided alternative dates
      newStatus = bookingStatuses.AWAITING_PAYMENT;
      updateData.status = newStatus;
      updateData.metadata = {
        ...(booking.metadata as object || {}),
        alternativeDates: parsed.availableDates,
        operatorNotes: parsed.notes,
      };

      // Notify customer of alternative dates
      if (booking.customer_email && booking.customer_name) {
        await sendEmail({
          to: booking.customer_email,
          subject: 'Alternative Dates Available',
          text: `Dear ${booking.customer_name},\n\nThe requested date is not available, but we have these alternative dates:\n${parsed.availableDates.join('\n')}\n\nPlease let us know which date works for you.\n\nBest regards,\nHelicopter Tours on Oahu`,
          html: `<p>Dear ${booking.customer_name},</p><p>The requested date is not available, but we have these alternative dates:</p><ul>${parsed.availableDates.map(d => `<li>${d}</li>`).join('')}</ul><p>Please let us know which date works for you.</p><p>Best regards,<br>Helicopter Tours on Oahu</p>`,
        });
      }
    } else {
      // General response - update metadata
      updateData.metadata = {
        ...(booking.metadata as object || {}),
        operatorResponse: parsed.notes,
        lastOperatorContact: new Date().toISOString(),
      };
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id);

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
            event: 'operator_reply',
            bookingId: validated.bookingId,
            parsed,
          }),
        });
      } catch (error) {
        console.error('n8n webhook error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: validated.bookingId,
        status: newStatus,
        parsed,
      },
    });
  } catch (error) {
    console.error('Operator reply error:', error);

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
